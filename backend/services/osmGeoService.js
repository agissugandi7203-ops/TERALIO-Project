import { CAMPUS_HUBS_DATA } from '../data/curatedAccommodations.js';

const toRad = (deg) => (deg * Math.PI) / 180;

const isValidPoint = (pt) =>
  Boolean(
    pt &&
      typeof pt === 'object' &&
      typeof pt.lat === 'number' &&
      Number.isFinite(pt.lat) &&
      typeof pt.lng === 'number' &&
      Number.isFinite(pt.lng),
  );

/**
 * Menghasilkan titik-titik kurva halus antara kampus dan kos ketika OSRM sedang offline,
 * sehingga polyline di peta in-platform tetap terlihat organik dan informatif.
 */
function buildSmoothFallbackGeometry(origin, destination, segments = 12) {
  const points = [];
  const dLat = destination.lat - origin.lat;
  const dLng = destination.lng - origin.lng;
  // Offset tegak lurus ringan agar tampak seperti koridor jalan lingkungan
  const perpLat = -dLng * 0.12;
  const perpLng = dLat * 0.12;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const arc = Math.sin(Math.PI * t);
    points.push([
      Number((origin.lat + dLat * t + perpLat * arc).toFixed(6)),
      Number((origin.lng + dLng * t + perpLng * arc).toFixed(6)),
    ]);
  }
  return points;
}

export function estimateHaversineRoute(origin, destination) {
  if (!isValidPoint(origin) || !isValidPoint(destination)) {
    return {
      distanceMeters: 650,
      distanceText: '650 m',
      walkMinutes: 8,
      rideMinutes: 3,
      durationText: '8 mnt jalan kaki',
      geometry: [],
      source: 'default-estimate',
    };
  }

  const R = 6371000;
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) * Math.sin(dLng / 2) ** 2;
  const straightMeters = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadMeters = Math.max(80, Math.round(straightMeters * 1.28));

  const distanceText =
    roadMeters >= 1000 ? `${(roadMeters / 1000).toFixed(1)} km` : `${roadMeters} m`;
  const walkMinutes = Math.max(1, Math.round(roadMeters / 76));
  const rideMinutes = Math.max(1, Math.round(roadMeters / 360));

  return {
    distanceMeters: roadMeters,
    distanceText,
    walkMinutes,
    rideMinutes,
    durationText: `${walkMinutes} mnt jalan kaki • ${rideMinutes} mnt motor`,
    geometry: buildSmoothFallbackGeometry(origin, destination),
    source: 'haversine-smart-estimate',
  };
}

export async function computeCampusRoute(
  origin,
  destination,
  { mode = 'foot', fetchImpl = globalThis.fetch, timeoutMs = 2200 } = {},
) {
  const fallback = estimateHaversineRoute(origin, destination);
  if (!isValidPoint(origin) || !isValidPoint(destination)) {
    return fallback;
  }

  // Hindari panggilan jaringan publik saat unit test kecuali fetch di-mock eksplisit
  if ((process.env.NODE_ENV === 'test' || process.env.VITEST) && fetchImpl === globalThis.fetch) {
    return fallback;
  }

  if (typeof fetchImpl !== 'function') {
    return fallback;
  }

  const profile = mode === 'driving' || mode === 'bike' ? 'driving' : 'foot';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return fallback;

    const payload = await response.json();
    const first = Array.isArray(payload?.routes) ? payload.routes[0] : null;
    const rawCoords = first?.geometry?.coordinates;
    if (!first || !Array.isArray(rawCoords) || rawCoords.length < 2) {
      return fallback;
    }

    const distanceMeters = Math.max(50, Math.round(Number(first.distance) || fallback.distanceMeters));
    const distanceText =
      distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`;
    const walkMinutes = Math.max(1, Math.round(distanceMeters / 76));
    const rideMinutes = Math.max(1, Math.round(distanceMeters / 360));

    const geometry = rawCoords
      .filter((pair) => Array.isArray(pair) && pair.length >= 2)
      .map(([lng, lat]) => [Number(lat), Number(lng)]);

    return {
      distanceMeters,
      distanceText,
      walkMinutes,
      rideMinutes,
      durationText: `${walkMinutes} mnt jalan kaki • ${rideMinutes} mnt motor`,
      geometry: geometry.length >= 2 ? geometry : fallback.geometry,
      source: 'osrm-open-routing',
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

const KNOWN_CAMPUS_ALIASES = [
  { keywords: ['telkom', 'sukapura', 'sukabirus', 'bojongsoang', 'dayeuhkolot', 'pga'], hubId: 'telkom' },
  { keywords: ['itb', 'ganesha', 'cisitu', 'dago', 'tamansari', 'dipatiukur', 'coblong'], hubId: 'itb' },
  { keywords: ['universitas indonesia', 'ui depok', 'kukusan', 'kutek', 'pondok cina', 'pocin', 'margonda'], hubId: 'ui' },
  { keywords: ['ugm', 'gadjah mada', 'pogung', 'sendowo', 'bulaksumur', 'sleman', 'jogja', 'yogyakarta'], hubId: 'ugm' },
];

export async function searchPlaceCoordinate(
  query,
  { fetchImpl = globalThis.fetch, timeoutMs = 2500 } = {},
) {
  const cleaned = String(query || '').trim();
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();
  for (const entry of KNOWN_CAMPUS_ALIASES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      const hub = CAMPUS_HUBS_DATA[entry.hubId];
      if (hub) {
        return {
          name: hub.name,
          address: hub.address,
          lat: hub.lat,
          lng: hub.lng,
          campusId: hub.id,
          source: 'campus-hub',
        };
      }
    }
  }

  if ((process.env.NODE_ENV === 'test' || process.env.VITEST) && fetchImpl === globalThis.fetch) {
    return null;
  }
  if (typeof fetchImpl !== 'function') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=id&limit=3&q=${encodeURIComponent(cleaned)}`;
    const res = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TeralioSmartKosPlatform/1.0',
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const rows = await res.json();
    const top = Array.isArray(rows) ? rows[0] : null;
    if (!top) return null;

    const lat = Number.parseFloat(top.lat);
    const lng = Number.parseFloat(top.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return {
      name: top.name || cleaned,
      address: top.display_name || cleaned,
      lat,
      lng,
      campusId: null,
      source: 'nominatim-osm',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const osmGeoService = {
  estimateHaversineRoute,
  computeCampusRoute,
  searchPlaceCoordinate,
};

export default osmGeoService;
