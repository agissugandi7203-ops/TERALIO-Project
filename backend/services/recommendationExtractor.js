/**
 * Verified Recommendation Extractor & Anti-Hallucination Gate.
 *
 * Hanya mengekstrak entitas rekomendasi tempat/kos yang berasal langsung dari hasil
 * eksekusi tools terverifikasi (`maps_search_places`, `maps_get_place_details`,
 * `teralio_search_accommodations`, `teralio_get_accommodation_details`, serta
 * pengayaan jarak dari `maps_compute_route`).
 *
 * Aturan ketat:
 *  1. Menolak hasil tool yang gagal (`ok !== true`).
 *  2. Menolak item boilerplate non-hunian (misal data starter `Frontend`, `Backend`, `Database`, `General`, `Testing`).
 *  3. Setiap entitas wajib memiliki `id`, `name` valid, serta bukti lokasi/deskripsi hunian nyata.
 *  4. Tidak pernah mengarang field kosong (telepon, alamat, harga, link peta bernilai `null` bila tidak ada di sumber).
 */

const NON_ACCOMMODATION_CATEGORIES = new Set([
  'frontend',
  'backend',
  'database',
  'general',
  'testing',
  'solar roof quote',
  'devops',
]);

const BOILERPLATE_TITLES = [
  /^inisialisasi project/i,
  /^inisialisasi backend/i,
  /^koneksi supabase/i,
  /^item \d+$/i,
  /^teralio quote/i,
];

const ACCOMMODATION_SIGNAL_REGEX =
  /\b(kos|kost|hunian|asrama|boarding|residence|apartemen|paviliun|wisma|kamar|kontrakan|guest\s*house|penginapan|jalan|jl\.|bandung|jakarta|depok|yogyakarta|malang|surabaya|kampus|universitas|itb|unpad|telkom|ugm|ui)\b/i;

const cleanString = (val) => (typeof val === 'string' && val.trim() !== '' ? val.trim() : null);

const isValidCoords = (loc) =>
  Boolean(
    loc &&
      typeof loc === 'object' &&
      typeof loc.lat === 'number' &&
      Number.isFinite(loc.lat) &&
      typeof loc.lng === 'number' &&
      Number.isFinite(loc.lng),
  );

const buildMapsUrlFromCoordsOrAddress = ({ googleMapsUri, placeId, location, address, name }) => {
  const directUri = cleanString(googleMapsUri);
  if (directUri && /^https?:\/\//i.test(directUri)) return directUri;

  if (isValidCoords(location)) {
    const query = encodeURIComponent(`${location.lat},${location.lng}`);
    const pid = cleanString(placeId);
    return pid
      ? `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${encodeURIComponent(pid)}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  const addr = cleanString(address);
  if (addr && placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name || ''} ${addr}`.trim())}&query_place_id=${encodeURIComponent(placeId)}`;
  }

  return null;
};

const extractPriceFromText = (text) => {
  if (typeof text !== 'string') return null;
  const match = text.match(/Rp\s?[\d.,]+\s*(?:juta|jt|rb|ribu)?(?:\s*\/\s*(?:bulan|bln|tahun|thn|malam))?/i);
  return match ? match[0].trim() : null;
};

const normalizeGooglePlace = (place) => {
  if (!place || typeof place !== 'object') return null;
  const id = cleanString(place.id);
  const name = cleanString(place.name);
  const address = cleanString(place.address) || cleanString(place.shortAddress);
  const location = isValidCoords(place.location) ? { lat: place.location.lat, lng: place.location.lng } : null;

  // Wajib punya nama dan bukti lokasi nyata (alamat atau koordinat)
  if (!id || !name || (!address && !location)) {
    return null;
  }

  const phone = cleanString(place.contact?.phone) || cleanString(place.contact?.internationalPhone);
  const website = cleanString(place.contact?.website);
  const directMapUri = cleanString(place.googleMapsUri);
  const mapUrl = buildMapsUrlFromCoordsOrAddress({
    googleMapsUri: directMapUri,
    placeId: id,
    location,
    address,
    name,
  });

  const openingStatus =
    typeof place.openingHours?.openNow === 'boolean'
      ? place.openingHours.openNow
        ? 'Sedang buka'
        : 'Sedang tutup'
      : null;

  return {
    id: `gmaps:${id}`,
    rawId: id,
    placeId: id,
    source: 'google_maps',
    sourceLabel: 'Google Maps',
    name,
    category: cleanString(place.primaryTypeLabel) || cleanString(place.primaryType) || null,
    description: cleanString(place.description),
    address,
    location,
    price: null,
    contact:
      phone || website
        ? {
            phone,
            website,
          }
        : null,
    rating: typeof place.rating === 'number' ? place.rating : null,
    userRatingCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
    openingStatus,
    openingHours: Array.isArray(place.openingHours?.weekdayDescriptions)
      ? place.openingHours.weekdayDescriptions.slice(0, 7)
      : [],
    features: [],
    routeSummary: null,
    directMapUri: directMapUri && /^https?:\/\//i.test(directMapUri) ? directMapUri : null,
    mapUrl,
  };
};

const isRealAccommodationRecord = (item) => {
  if (!item || typeof item !== 'object') return false;
  const title = cleanString(item.name) || cleanString(item.title);
  if (!title) return false;

  if (BOILERPLATE_TITLES.some((re) => re.test(title))) {
    return false;
  }

  const category = (cleanString(item.category) || '').toLowerCase();
  if (category && NON_ACCOMMODATION_CATEGORIES.has(category)) {
    return false;
  }

  const address = cleanString(item.address);
  const location = isValidCoords(item.location) ? item.location : null;
  if (address || location) return true;

  // Untuk skema ItemModel sederhana (title + description + category), pastikan benar-benar memuat sinyal hunian/kos
  const combined = `${title} ${cleanString(item.category) || ''} ${cleanString(item.description) || ''}`;
  return ACCOMMODATION_SIGNAL_REGEX.test(combined);
};

const normalizeTeralioAccommodation = (item) => {
  if (!isRealAccommodationRecord(item)) return null;

  const rawId = cleanString(String(item.id ?? ''));
  const name = cleanString(item.name) || cleanString(item.title);
  if (!rawId || !name) return null;

  const description = cleanString(item.description);
  const address = cleanString(item.address) || cleanString(item.distance) || null;
  const location =
    isValidCoords(item.location)
      ? { lat: item.location.lat, lng: item.location.lng }
      : typeof item.latitude === 'number' && typeof item.longitude === 'number'
        ? { lat: item.latitude, lng: item.longitude }
        : null;

  const explicitPrice =
    cleanString(item.price) ||
    (typeof item.price_monthly === 'number'
      ? `Rp${item.price_monthly.toLocaleString('id-ID')} / bln`
      : extractPriceFromText(description));

  const phone = cleanString(item.contact?.phone) || cleanString(item.contact_phone) || cleanString(item.phone);
  const website = cleanString(item.contact?.website) || cleanString(item.website);

  const mapUrl = buildMapsUrlFromCoordsOrAddress({
    googleMapsUri: item.googleMapsUri || item.mapUrl,
    placeId: item.placeId,
    location,
    address: cleanString(item.address),
    name,
  });

  return {
    id: `teralio:${rawId}`,
    rawId,
    placeId: cleanString(item.placeId),
    source: 'teralio_db',
    sourceLabel: 'TERALIO Database',
    name,
    category: cleanString(item.type) || cleanString(item.category) || 'Hunian / Kos',
    description,
    address,
    location,
    price: explicitPrice,
    contact:
      phone || website
        ? {
            phone,
            website,
          }
        : null,
    rating: typeof item.rating === 'number' ? item.rating : null,
    userRatingCount: null,
    openingStatus: null,
    openingHours: [],
    features: Array.isArray(item.features)
      ? item.features.map(cleanString).filter(Boolean)
      : Array.isArray(item.facilities)
        ? item.facilities.map(cleanString).filter(Boolean)
        : [],
    routeSummary: null,
    mapUrl,
  };
};

const mergePlaceRecord = (existing, incoming) => {
  const bestDirectMapUri = incoming.directMapUri || existing.directMapUri || null;
  return {
    ...existing,
    category: incoming.category || existing.category,
    description: incoming.description || existing.description,
    address: incoming.address || existing.address,
    location: incoming.location || existing.location,
    price: incoming.price || existing.price,
    contact: incoming.contact
      ? {
          phone: incoming.contact.phone || existing.contact?.phone || null,
          website: incoming.contact.website || existing.contact?.website || null,
        }
      : existing.contact,
    rating: incoming.rating ?? existing.rating,
    userRatingCount: incoming.userRatingCount ?? existing.userRatingCount,
    openingStatus: incoming.openingStatus || existing.openingStatus,
    openingHours: incoming.openingHours?.length > 0 ? incoming.openingHours : existing.openingHours,
    features: incoming.features?.length > 0 ? incoming.features : existing.features,
    routeSummary: incoming.routeSummary || existing.routeSummary,
    directMapUri: bestDirectMapUri,
    mapUrl: bestDirectMapUri || incoming.mapUrl || existing.mapUrl,
  };
};

/**
 * Mengekstrak daftar rekomendasi tempat/kos tervalidasi dari kumpulan eksekusi tool.
 *
 * @param {Array<{ name: string, args?: object, ok: boolean, data?: any }>} executions
 * @returns {{ hasValidRecommendations: boolean, queryContext: string | null, items: Array<object> }}
 */
export function extractVerifiedRecommendations(executions = []) {
  if (!Array.isArray(executions) || executions.length === 0) {
    return { hasValidRecommendations: false, queryContext: null, items: [] };
  }

  const byId = new Map();
  const routeEntries = [];
  let latestQueryContext = null;

  for (const exec of executions) {
    if (!exec || exec.ok !== true || !exec.data) continue;

    const toolName = exec.name;
    const args = exec.args && typeof exec.args === 'object' ? exec.args : {};
    const data = exec.data;

    if (toolName === 'maps_search_places') {
      if (cleanString(args.query) || cleanString(data.query)) {
        latestQueryContext = cleanString(args.query) || cleanString(data.query);
      }
      const places = Array.isArray(data.places) ? data.places : [];
      for (const rawPlace of places) {
        const normalized = normalizeGooglePlace(rawPlace);
        if (!normalized) continue;
        const prev = byId.get(normalized.id);
        byId.set(normalized.id, prev ? mergePlaceRecord(prev, normalized) : normalized);
      }
    } else if (toolName === 'maps_get_place_details') {
      const normalized = normalizeGooglePlace(data.place);
      if (normalized) {
        const prev = byId.get(normalized.id);
        byId.set(normalized.id, prev ? mergePlaceRecord(prev, normalized) : normalized);
      }
    } else if (toolName === 'teralio_search_accommodations') {
      if (cleanString(args.query)) {
        latestQueryContext = cleanString(args.query);
      }
      const list = Array.isArray(data.accommodations) ? data.accommodations : [];
      for (const rawItem of list) {
        const normalized = normalizeTeralioAccommodation(rawItem);
        if (!normalized) continue;
        const prev = byId.get(normalized.id);
        byId.set(normalized.id, prev ? mergePlaceRecord(prev, normalized) : normalized);
      }
    } else if (toolName === 'teralio_get_accommodation_details') {
      const normalized = normalizeTeralioAccommodation(data.accommodation);
      if (normalized) {
        const prev = byId.get(normalized.id);
        byId.set(normalized.id, prev ? mergePlaceRecord(prev, normalized) : normalized);
      }
    } else if (toolName === 'maps_compute_route') {
      const firstRoute = Array.isArray(data.routes) ? data.routes[0] : null;
      if (firstRoute && (firstRoute.distanceText || firstRoute.durationText)) {
        routeEntries.push({
          origin: args.origin,
          destination: args.destination,
          travelMode: data.travelMode || args.travelMode || 'DRIVE',
          distanceText: cleanString(firstRoute.distanceText),
          durationText: cleanString(firstRoute.durationText),
          distanceMeters: firstRoute.distanceMeters ?? null,
        });
      }
    }
  }

  // Cocokkan informasi rute (jika ada) ke item yang sesuai berdasarkan placeId atau nama tempat
  if (routeEntries.length > 0 && byId.size > 0) {
    for (const route of routeEntries) {
      const originPid = typeof route.origin === 'object' ? route.origin?.placeId : null;
      const destPid = typeof route.destination === 'object' ? route.destination?.placeId : null;
      const originText = typeof route.origin === 'string' ? route.origin.toLowerCase() : '';
      const destText = typeof route.destination === 'string' ? route.destination.toLowerCase() : '';

      for (const [key, item] of byId.entries()) {
        const pidMatch =
          item.placeId && (item.placeId === originPid || item.placeId === destPid);
        const nameLower = item.name.toLowerCase();
        const textMatch =
          nameLower.length >= 4 &&
          ((originText && originText.includes(nameLower)) || (destText && destText.includes(nameLower)));

        if (pidMatch || textMatch) {
          const targetLabel =
            typeof route.destination === 'string' && !destText.includes(nameLower)
              ? route.destination
              : typeof route.origin === 'string' && !originText.includes(nameLower)
                ? route.origin
                : null;
          byId.set(key, {
            ...item,
            routeSummary: {
              distanceText: route.distanceText,
              durationText: route.durationText,
              travelMode: route.travelMode,
              targetLabel,
            },
          });
        }
      }
    }
  }

  const items = Array.from(byId.values());
  return {
    hasValidRecommendations: items.length > 0,
    queryContext: latestQueryContext,
    items,
  };
}

export default {
  extractVerifiedRecommendations,
};
