/**
 * Google Maps Service Layer for TERALIO Smart Kos Match.
 *
 * Supports dual-engine rendering:
 * 1. Native Google Maps JavaScript API (`VITE_GOOGLE_MAPS_BROWSER_API_KEY`) when configured,
 *    with automatic fallback if key is absent or blocked.
 * 2. Official Google Maps Live Interactive Embed (`maps.google.com`) for zero-config
 *    immediate map rendering.
 * 3. Server-side Google Maps Platform REST integration (`/api/maps/places/search`,
 *    `/api/maps/routes`, `/api/maps/geocode`, `/api/maps/status`).
 */

const isPlaceholderKey = (val) =>
  !val || /placeholder|your[-_]|xxxx|<.*>|here$/i.test(String(val).trim());

export function getBrowserMapsApiKey() {
  const raw =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_GOOGLE_MAPS_BROWSER_API_KEY) ||
    '';
  const trimmed = String(raw).trim();
  return isPlaceholderKey(trimmed) ? '' : trimmed;
}

let sdkLoadPromise = null;

/**
 * Dynamically loads the Google Maps JavaScript SDK in the browser.
 * Resolves with `window.google.maps` or rejects so caller can fall back cleanly.
 */
export function loadGoogleMapsSdk(apiKey = getBrowserMapsApiKey()) {
  if (!apiKey) {
    return Promise.reject(new Error('NO_BROWSER_API_KEY'));
  }
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('NON_BROWSER_ENV'));
  }
  if (window.google && window.google.maps && window.google.maps.Map) {
    return Promise.resolve(window.google.maps);
  }
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise((resolve, reject) => {
    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      sdkLoadPromise = null;
      if (typeof prevAuthFailure === 'function') prevAuthFailure();
      window.dispatchEvent(new CustomEvent('teralio:gmaps-auth-error'));
      reject(new Error('GOOGLE_MAPS_AUTH_FAILURE'));
    };

    const existing = document.getElementById('teralio-google-maps-sdk');
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.google?.maps?.Map) resolve(window.google.maps);
        else reject(new Error('GOOGLE_MAPS_UNAVAILABLE'));
      });
      existing.addEventListener('error', () => {
        sdkLoadPromise = null;
        reject(new Error('GOOGLE_MAPS_SCRIPT_ERROR'));
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'teralio-google-maps-sdk';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places,geometry&v=weekly&language=id&region=ID`;

    script.onload = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        resolve(window.google.maps);
      } else {
        sdkLoadPromise = null;
        reject(new Error('GOOGLE_MAPS_INIT_FAILED'));
      }
    };

    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error('GOOGLE_MAPS_NETWORK_ERROR'));
    };

    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

/**
 * Checks server-side Google Maps Platform status (`/api/maps/status`).
 */
export async function fetchMapsBackendStatus() {
  try {
    const res = await fetch('/api/maps/status');
    if (!res.ok) return { configured: false };
    const payload = await res.json();
    return payload?.data || { configured: false };
  } catch {
    return { configured: false };
  }
}

/**
 * Searches real places around a coordinate via backend `/api/maps/places/search`.
 */
export async function searchGooglePlaces({
  query,
  lat,
  lng,
  radiusMeters = 2500,
  maxResults = 10,
}) {
  if (!query || String(query).trim().length < 2) {
    return { ok: false, places: [] };
  }

  const params = new URLSearchParams({
    query: String(query).trim(),
    maxResults: String(maxResults),
    radiusMeters: String(radiusMeters),
  });

  if (typeof lat === 'number' && typeof lng === 'number') {
    params.set('lat', String(lat));
    params.set('lng', String(lng));
  }

  try {
    const res = await fetch(`/api/maps/places/search?${params.toString()}`);
    if (!res.ok) {
      return { ok: false, status: res.status, places: [] };
    }
    const payload = await res.json();
    const places = Array.isArray(payload?.data?.places) ? payload.data.places : [];
    return { ok: true, places, source: payload?.data?.source || 'google_maps_places' };
  } catch {
    return { ok: false, places: [] };
  }
}

/**
 * Computes route distance, duration, and encoded polyline via `/api/maps/routes`.
 */
export async function computeCampusRoute({
  origin,
  destination,
  travelMode = 'WALK',
}) {
  try {
    const res = await fetch('/api/maps/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        travelMode,
      }),
    });
    if (!res.ok) return { ok: false, route: null };
    const payload = await res.json();
    const firstRoute = payload?.data?.routes?.[0] || null;
    return { ok: Boolean(firstRoute), route: firstRoute };
  } catch {
    return { ok: false, route: null };
  }
}

/**
 * Decodes an encoded Google Polyline string into `[{ lat, lng }, ...]`.
 */
export function decodeGooglePolyline(encoded) {
  if (!encoded || typeof encoded !== 'string') return [];
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * Calculates Haversine street-adjusted distance & realistic walking/riding ETA.
 */
export function estimateDistanceAndEta(origin, destination) {
  if (
    !origin ||
    !destination ||
    typeof origin.lat !== 'number' ||
    typeof destination.lat !== 'number'
  ) {
    return {
      distanceMeters: 650,
      distanceText: '650 m',
      walkMinutes: 8,
      rideMinutes: 2,
    };
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(destination.lat)) *
      Math.sin(dLng / 2) ** 2;
  const straightMeters = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Urban street factor ~1.24x straight-line distance
  const streetMeters = Math.max(80, Math.round(straightMeters * 1.24));

  const distanceText =
    streetMeters >= 1000
      ? `${(streetMeters / 1000).toFixed(1)} km`
      : `${streetMeters} m`;

  const walkMinutes = Math.max(1, Math.round(streetMeters / 76));
  const rideMinutes = Math.max(1, Math.round(streetMeters / 360));

  return {
    distanceMeters: streetMeters,
    distanceText,
    walkMinutes,
    rideMinutes,
  };
}

/**
 * Builds an official live Google Maps embed URL that works immediately in an iframe.
 */
export function buildGoogleMapsEmbedUrl({
  lat,
  lng,
  query = '',
  zoom = 16,
  mapType = 'roadmap',
}) {
  const typeFlag = mapType === 'satellite' ? 'h' : 'm';
  const trimmedQuery = String(query || '').trim();

  if (trimmedQuery) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(
      trimmedQuery
    )}&z=${zoom}&t=${typeFlag}&hl=id&output=embed`;
  }

  const safeLat = typeof lat === 'number' ? lat.toFixed(6) : '-6.973300';
  const safeLng = typeof lng === 'number' ? lng.toFixed(6) : '107.630500';
  return `https://maps.google.com/maps?q=${safeLat},${safeLng}&ll=${safeLat},${safeLng}&z=${zoom}&t=${typeFlag}&hl=id&output=embed`;
}

export function buildGoogleMapsDirectionsUrl({
  origin,
  destination,
  travelMode = 'walking',
}) {
  if (!destination) return 'https://www.google.com/maps';
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.lat},${destination.lng}`,
    travelmode: travelMode,
  });
  if (origin && typeof origin.lat === 'number' && typeof origin.lng === 'number') {
    params.set('origin', `${origin.lat},${origin.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildGoogleMapsStreetViewUrl({ lat, lng }) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}
