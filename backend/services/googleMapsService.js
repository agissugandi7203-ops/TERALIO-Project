import { config, isGoogleMapsConfigured } from '../config/env.js';
import { AppError, badRequest, notConfigured, notFound } from '../utils/errors.js';
import { fetchJson } from '../utils/http.js';
import { createLogger } from '../utils/logger.js';

/**
 * Google Maps Platform service (server-side).
 *
 * API yang digunakan (semuanya REST resmi Google, autentikasi via API key server):
 *  - Places API (New)  : Text Search  -> POST https://places.googleapis.com/v1/places:searchText
 *                        Place Details -> GET  https://places.googleapis.com/v1/places/{placeId}
 *  - Geocoding API     : GET https://maps.googleapis.com/maps/api/geocode/json
 *  - Routes API        : POST https://routes.googleapis.com/directions/v2:computeRoutes
 *
 * Biaya ditentukan oleh SKU yang dipicu field mask. Field mask di bawah sengaja dibatasi.
 */
const log = createLogger('GoogleMaps');

const PLACES_BASE = 'https://places.googleapis.com/v1';
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

/** Text Search (New) -> SKU "Text Search Pro". */
const TEXT_SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.googleMapsUri',
  'places.businessStatus',
  'nextPageToken',
];

/** Place Details (New): field mask per level -> SKU tertinggi yang dipicu. */
const DETAILS_FIELDS = {
  // Place Details Pro
  basic: [
    'id',
    'displayName',
    'formattedAddress',
    'shortFormattedAddress',
    'addressComponents',
    'location',
    'types',
    'primaryType',
    'primaryTypeDisplayName',
    'googleMapsUri',
    'businessStatus',
  ],
  // Place Details Enterprise (kontak, rating, jam buka)
  contact: [
    'nationalPhoneNumber',
    'internationalPhoneNumber',
    'websiteUri',
    'rating',
    'userRatingCount',
    'regularOpeningHours',
    'priceLevel',
  ],
  // Place Details Enterprise + Atmosphere (deskripsi editorial)
  full: ['editorialSummary'],
};

export const DETAILS_SKU = {
  basic: 'Place Details Pro',
  contact: 'Place Details Enterprise',
  full: 'Place Details Enterprise + Atmosphere',
};

const ROUTE_FIELDS = [
  'routes.distanceMeters',
  'routes.duration',
  'routes.staticDuration',
  'routes.description',
  'routes.warnings',
  'routes.localizedValues',
  'routes.polyline.encodedPolyline',
];

const TRAVEL_MODES = ['DRIVE', 'TWO_WHEELER', 'WALK', 'BICYCLE', 'TRANSIT'];

const ensureConfigured = () => {
  if (!isGoogleMapsConfigured()) {
    throw notConfigured(
      'GOOGLE_MAPS',
      'GOOGLE_MAPS_SERVER_API_KEY belum diisi. Buat API key server di Google Cloud Console (dengan billing account aktif) lalu isi di backend/.env.',
    );
  }
};

const fieldsForLevel = (level) => {
  const resolved = DETAILS_FIELDS[level] ? level : 'basic';
  const fields = [...DETAILS_FIELDS.basic];
  if (resolved === 'contact' || resolved === 'full') fields.push(...DETAILS_FIELDS.contact);
  if (resolved === 'full') fields.push(...DETAILS_FIELDS.full);
  return { level: resolved, fields };
};

/**
 * Error Places/Routes (format google.rpc.Status) -> AppError yang jelas,
 * termasuk deteksi kasus billing belum aktif.
 */
const mapGoogleError = (err, api) => {
  if (!(err instanceof AppError)) return err;
  const upstream = err.details?.upstream;
  const message = upstream?.message || upstream?.error_message || '';
  const reason = upstream?.details?.find?.((d) => d.reason)?.reason || upstream?.status || '';

  if (/billing/i.test(message) || reason === 'BILLING_DISABLED') {
    return new AppError(
      402,
      'GOOGLE_MAPS_BILLING_REQUIRED',
      `${api} membutuhkan billing account aktif pada project Google Cloud. Aktifkan billing lalu coba lagi.`,
      { api, upstreamStatus: err.details?.upstreamStatus, reason: reason || null },
    );
  }
  if (reason === 'API_KEY_SERVICE_BLOCKED' || reason === 'SERVICE_DISABLED' || /not been used|is disabled|not authorized/i.test(message)) {
    return new AppError(
      403,
      'GOOGLE_MAPS_API_NOT_ENABLED',
      `${api} belum diaktifkan pada project atau API key dibatasi untuk API lain.`,
      { api, reason: reason || null, upstreamMessage: message || null },
    );
  }
  if (reason === 'API_KEY_INVALID' || /API key not valid/i.test(message)) {
    return new AppError(502, 'GOOGLE_MAPS_INVALID_KEY', 'GOOGLE_MAPS_SERVER_API_KEY tidak valid.', { api });
  }
  return err;
};

const normalizePlace = (place = {}) => ({
  id: place.id ?? null,
  name: place.displayName?.text ?? null,
  primaryType: place.primaryType ?? null,
  primaryTypeLabel: place.primaryTypeDisplayName?.text ?? null,
  types: place.types ?? [],
  address: place.formattedAddress ?? null,
  shortAddress: place.shortFormattedAddress ?? null,
  location:
    place.location && typeof place.location.latitude === 'number'
      ? { lat: place.location.latitude, lng: place.location.longitude }
      : null,
  googleMapsUri: place.googleMapsUri ?? null,
  businessStatus: place.businessStatus ?? null,
  description: place.editorialSummary?.text ?? null,
  contact: {
    phone: place.nationalPhoneNumber ?? null,
    internationalPhone: place.internationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
  },
  rating: place.rating ?? null,
  userRatingCount: place.userRatingCount ?? null,
  priceLevel: place.priceLevel ?? null,
  openingHours: place.regularOpeningHours
    ? {
        openNow: place.regularOpeningHours.openNow ?? null,
        weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions ?? [],
      }
    : null,
  addressComponents: place.addressComponents?.map((c) => ({
    long: c.longText,
    short: c.shortText,
    types: c.types,
  })),
});

const toWaypoint = (input) => {
  if (!input) throw badRequest('Origin dan destination wajib diisi');
  if (typeof input === 'string') return { address: input };
  if (input.placeId) return { placeId: input.placeId };
  if (typeof input.lat === 'number' && typeof input.lng === 'number') {
    return { location: { latLng: { latitude: input.lat, longitude: input.lng } } };
  }
  if (input.address) return { address: input.address };
  throw badRequest('Waypoint harus berupa alamat, { placeId } atau { lat, lng }');
};

const parseDurationSeconds = (value) => (typeof value === 'string' ? Number.parseFloat(value.replace('s', '')) : null);

export const googleMapsService = {
  getStatus() {
    return {
      service: 'Google Maps Platform',
      configured: isGoogleMapsConfigured(),
      apis: ['Places API (New)', 'Geocoding API', 'Routes API'],
      languageCode: config.googleMaps.languageCode,
      regionCode: config.googleMaps.regionCode,
      defaultDetailsLevel: config.googleMaps.detailsLevel,
      billingNote:
        'Seluruh API Google Maps Platform mewajibkan billing account aktif, walaupun pemakaian masih di dalam free usage cap bulanan.',
    };
  },

  /** Cari tempat berdasarkan nama/kata kunci (Places API New - Text Search). */
  async searchPlaces({ query, location, radiusMeters = 3000, maxResults = 10, includedType, openNow, pageToken } = {}) {
    ensureConfigured();
    const body = {
      textQuery: query,
      languageCode: config.googleMaps.languageCode,
      regionCode: config.googleMaps.regionCode,
      pageSize: maxResults,
      ...(includedType ? { includedType } : {}),
      ...(typeof openNow === 'boolean' ? { openNow } : {}),
      ...(pageToken ? { pageToken } : {}),
      ...(location
        ? {
            locationBias: {
              circle: { center: { latitude: location.lat, longitude: location.lng }, radius: radiusMeters },
            },
          }
        : {}),
    };

    try {
      const { body: data } = await fetchJson(`${PLACES_BASE}/places:searchText`, {
        method: 'POST',
        service: 'GOOGLE_MAPS',
        timeoutMs: config.googleMaps.timeoutMs,
        retries: config.googleMaps.maxRetries,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': config.googleMaps.serverApiKey,
          'X-Goog-FieldMask': TEXT_SEARCH_FIELDS.join(','),
        },
        body: JSON.stringify(body),
      });
      const places = (data?.places ?? []).map(normalizePlace);
      return {
        source: 'google_maps_places_text_search',
        sku: 'Text Search Pro',
        query,
        count: places.length,
        places,
        nextPageToken: data?.nextPageToken ?? null,
      };
    } catch (err) {
      const mapped = mapGoogleError(err, 'Places API (New)');
      log.warn('searchPlaces gagal', { code: mapped.code, status: mapped.status });
      throw mapped;
    }
  },

  /** Detail tempat (Places API New - Place Details). */
  async getPlaceDetails({ placeId, level = config.googleMaps.detailsLevel } = {}) {
    ensureConfigured();
    if (!placeId || !/^[A-Za-z0-9_-]+$/.test(placeId)) throw badRequest('placeId tidak valid');
    const { level: resolvedLevel, fields } = fieldsForLevel(level);
    const params = new URLSearchParams({
      languageCode: config.googleMaps.languageCode,
      regionCode: config.googleMaps.regionCode,
    });

    try {
      const { body: data } = await fetchJson(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}?${params}`, {
        method: 'GET',
        service: 'GOOGLE_MAPS',
        timeoutMs: config.googleMaps.timeoutMs,
        retries: config.googleMaps.maxRetries,
        headers: {
          'X-Goog-Api-Key': config.googleMaps.serverApiKey,
          'X-Goog-FieldMask': fields.join(','),
        },
      });
      return {
        source: 'google_maps_place_details',
        sku: DETAILS_SKU[resolvedLevel],
        level: resolvedLevel,
        place: normalizePlace(data),
      };
    } catch (err) {
      if (err instanceof AppError && err.details?.upstreamStatus === 404) {
        throw notFound(`Tempat dengan placeId '${placeId}' tidak ditemukan`);
      }
      const mapped = mapGoogleError(err, 'Places API (New)');
      log.warn('getPlaceDetails gagal', { code: mapped.code, status: mapped.status });
      throw mapped;
    }
  },

  /** Geocoding (alamat -> koordinat) atau reverse geocoding (koordinat -> alamat). */
  async geocode({ address, lat, lng } = {}) {
    ensureConfigured();
    const params = new URLSearchParams({
      key: config.googleMaps.serverApiKey,
      language: config.googleMaps.languageCode,
      region: config.googleMaps.regionCode.toLowerCase(),
    });
    if (address) params.set('address', address);
    else if (typeof lat === 'number' && typeof lng === 'number') params.set('latlng', `${lat},${lng}`);
    else throw badRequest('Isi "address" atau pasangan "lat" & "lng"');

    const { body: data } = await fetchJson(`${GEOCODE_URL}?${params}`, {
      method: 'GET',
      service: 'GOOGLE_MAPS',
      timeoutMs: config.googleMaps.timeoutMs,
      retries: config.googleMaps.maxRetries,
    });

    // Geocoding API mengembalikan HTTP 200 dengan field `status` untuk error.
    const status = data?.status;
    if (status === 'REQUEST_DENIED') {
      throw mapGoogleError(
        new AppError(502, 'GOOGLE_MAPS_UPSTREAM_ERROR', 'Geocoding API menolak permintaan', {
          upstreamStatus: 200,
          upstream: { message: data?.error_message || 'REQUEST_DENIED', status },
        }),
        'Geocoding API',
      );
    }
    if (status === 'OVER_QUERY_LIMIT' || status === 'OVER_DAILY_LIMIT') {
      throw new AppError(429, 'GOOGLE_MAPS_QUOTA_EXCEEDED', 'Kuota Geocoding API terlampaui');
    }
    if (status === 'INVALID_REQUEST') throw badRequest('Permintaan geocoding tidak valid');
    if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
      throw new AppError(502, 'GOOGLE_MAPS_UPSTREAM_ERROR', `Geocoding API status ${status}`);
    }

    const results = (data?.results ?? []).map((r) => ({
      placeId: r.place_id,
      address: r.formatted_address,
      location: r.geometry?.location ? { lat: r.geometry.location.lat, lng: r.geometry.location.lng } : null,
      locationType: r.geometry?.location_type ?? null,
      types: r.types ?? [],
    }));
    return { source: 'google_maps_geocoding', sku: 'Geocoding', count: results.length, results };
  },

  /** Rute & estimasi waktu tempuh (Routes API - computeRoutes). */
  async computeRoute({ origin, destination, travelMode = 'DRIVE', trafficAware = false } = {}) {
    ensureConfigured();
    const mode = String(travelMode).toUpperCase();
    if (!TRAVEL_MODES.includes(mode)) throw badRequest(`travelMode harus salah satu dari ${TRAVEL_MODES.join(', ')}`);

    const body = {
      origin: toWaypoint(origin),
      destination: toWaypoint(destination),
      travelMode: mode,
      languageCode: config.googleMaps.languageCode,
      regionCode: config.googleMaps.regionCode,
      units: 'METRIC',
      computeAlternativeRoutes: false,
      // routingPreference hanya valid untuk DRIVE/TWO_WHEELER. TRAFFIC_AWARE memicu SKU Pro.
      ...(mode === 'DRIVE' || mode === 'TWO_WHEELER'
        ? { routingPreference: trafficAware ? 'TRAFFIC_AWARE' : 'TRAFFIC_UNAWARE' }
        : {}),
    };

    try {
      const { body: data } = await fetchJson(ROUTES_URL, {
        method: 'POST',
        service: 'GOOGLE_MAPS',
        timeoutMs: config.googleMaps.timeoutMs,
        retries: config.googleMaps.maxRetries,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': config.googleMaps.serverApiKey,
          'X-Goog-FieldMask': ROUTE_FIELDS.join(','),
        },
        body: JSON.stringify(body),
      });
      const routes = (data?.routes ?? []).map((r) => ({
        distanceMeters: r.distanceMeters ?? null,
        durationSeconds: parseDurationSeconds(r.duration),
        staticDurationSeconds: parseDurationSeconds(r.staticDuration),
        distanceText: r.localizedValues?.distance?.text ?? null,
        durationText: r.localizedValues?.duration?.text ?? null,
        description: r.description ?? null,
        warnings: r.warnings ?? [],
        encodedPolyline: r.polyline?.encodedPolyline ?? null,
      }));
      return {
        source: 'google_maps_routes',
        sku: trafficAware && (mode === 'DRIVE' || mode === 'TWO_WHEELER') ? 'Compute Routes Pro' : 'Compute Routes Essentials',
        travelMode: mode,
        count: routes.length,
        routes,
      };
    } catch (err) {
      const mapped = mapGoogleError(err, 'Routes API');
      log.warn('computeRoute gagal', { code: mapped.code, status: mapped.status });
      throw mapped;
    }
  },
};

export default googleMapsService;
