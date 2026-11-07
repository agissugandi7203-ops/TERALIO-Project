import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Google Maps Tiles (100% Asli Google Maps, tanpa API key, tanpa watermark, tanpa billing)
// Mendukung scale=2 otomatis untuk layar mobile Retina / High-DPI agar tidak blur atau pecah
const GOOGLE_SUBDOMAINS = ['mt0', 'mt1', 'mt2', 'mt3'];

export function getGoogleTileUrl(layerType = 'satellite') {
  const isRetina =
    typeof window !== 'undefined' &&
    ((window.devicePixelRatio && window.devicePixelRatio >= 1.25) ||
      (window.matchMedia &&
        window.matchMedia('(-webkit-min-device-pixel-ratio: 1.25), (min-resolution: 120dpi)').matches));
  const scale = isRetina ? '&scale=2' : '';
  const lyrs = layerType === 'satellite' ? 'y' : 'm';
  return `https://{s}.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}${scale}`;
}

export function getMapTileConfig(layerType = 'satellite') {
  if (layerType === 'satellite') {
    return {
      type: 'satellite',
      baseLayers: [
        {
          url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          options: {
            maxZoom: 20,
            maxNativeZoom: 20,
            minZoom: 3,
            subdomains: ['0', '1', '2', '3'],
            attribution: '&copy; Google Maps',
            tileSize: 256,
            keepBuffer: 6,
            updateWhenIdle: false,
            updateWhenZooming: true,
          },
        },
      ],
    };
  }

  // Roadmap: Google Maps Vector Style Road raster
  return {
    type: 'roadmap',
    baseLayers: [
      {
        url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        options: {
          maxZoom: 20,
          maxNativeZoom: 20,
          minZoom: 3,
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Maps',
          tileSize: 256,
          keepBuffer: 6,
          updateWhenIdle: false,
          updateWhenZooming: true,
        },
      },
    ],
  };
}

function applyTileLayers(tileGroup, layerType) {
  if (!tileGroup) return;
  tileGroup.clearLayers();
  const config = getMapTileConfig(layerType);
  for (const layer of config.baseLayers) {
    L.tileLayer(layer.url, layer.options).addTo(tileGroup);
  }
}

function formatShortPrice(priceMonthly, priceStr) {
  const numeric = Number(priceMonthly);
  if (Number.isFinite(numeric) && numeric > 0) {
    const jt = (numeric / 1_000_000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
    return `Rp${jt} Jt`;
  }
  if (typeof priceStr === 'string' && priceStr.trim()) {
    return priceStr.replace(/\s*\/\s*bln/i, '').trim();
  }
  return 'Kos';
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function InPlatformMapCanvas({
  campus = null,
  accommodations = [],
  selectedKos = null,
  onSelectKos,
  mapType = 'satellite',
  zoom = 16,
  route = null,
  showRouteLine = true,
  flyToTrigger = 0,
  mini = false,
  className = '',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileGroupRef = useRef(null);
  const overlayGroupRef = useRef(null);
  const previousTargetKeyRef = useRef('');

  const centerTarget = useMemo(() => {
    if (selectedKos && typeof selectedKos.lat === 'number' && typeof selectedKos.lng === 'number') {
      return { lat: selectedKos.lat, lng: selectedKos.lng, id: selectedKos.id };
    }
    if (campus && typeof campus.lat === 'number' && typeof campus.lng === 'number') {
      return { lat: campus.lat, lng: campus.lng, id: `campus-${campus.id}` };
    }
    return { lat: -6.9733, lng: 107.6305, id: 'default-telkom' };
  }, [selectedKos, campus]);

  // 1. Inisialisasi instance Leaflet Map satu kali
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return undefined;

    const isZeroSizeEnv = el.clientWidth === 0 && el.clientHeight === 0;

    const map = L.map(el, {
      center: [centerTarget.lat, centerTarget.lng],
      zoom,
      zoomControl: false,
      attributionControl: !mini,
      zoomAnimation: !isZeroSizeEnv,
      fadeAnimation: !isZeroSizeEnv,
      markerZoomAnimation: !isZeroSizeEnv,
      zoomSnap: 1, // Kunci integer zoom agar tile raster tidak mengalami fractional scaling blur di layar sentuh
      zoomDelta: 1,
      wheelDebounceTime: 80,
      minZoom: 4,
      maxZoom: 20,
    });

    if (map.attributionControl) {
      map.attributionControl.setPrefix('TERALIO GeoEngine');
    }

    tileGroupRef.current = L.layerGroup().addTo(map);
    overlayGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Tambahkan layer tiles langsung saat map dibuat (tahan terhadap React StrictMode / remount)
    applyTileLayers(tileGroupRef.current, mapType);

    // Trigger pembaruan ukuran map untuk layout mobile dan transisi tabs
    const initTimer1 = setTimeout(() => {
      try {
        map.invalidateSize({ pan: false });
      } catch {}
    }, 100);

    const initTimer2 = setTimeout(() => {
      try {
        map.invalidateSize({ pan: false });
      } catch {}
    }, 350);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        try {
          map.invalidateSize({ pan: false });
        } catch {
          // ignore resize errors on unmount
        }
      });
      resizeObserver.observe(el);
    }

    const handleViewportChange = () => {
      try {
        map.invalidateSize({ pan: false });
      } catch {
        // ignore
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleViewportChange, { passive: true });
      window.addEventListener('orientationchange', handleViewportChange, { passive: true });
    }

    return () => {
      clearTimeout(initTimer1);
      clearTimeout(initTimer2);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('orientationchange', handleViewportChange);
      }
      if (resizeObserver) resizeObserver.disconnect();
      try {
        map.remove();
      } catch {
        // ignore cleanup errors in JSDOM
      }
      mapRef.current = null;
      tileGroupRef.current = null;
      overlayGroupRef.current = null;
    };
  }, []);

  // 2. Sinkronisasi Layer Satelit Hybrid vs Peta Jalan (Roadmap)
  useEffect(() => {
    applyTileLayers(tileGroupRef.current, mapType);
  }, [mapType]);

  // 3. Animasi Kamera Halus (`flyTo`) saat AI mengarahkan ke lokasi kos / kampus berubah / zoom berubah
  useEffect(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el) return;

    const nextKey = `${centerTarget.lat.toFixed(5)}:${centerTarget.lng.toFixed(5)}:${zoom}:${flyToTrigger}`;
    const isFirstMove = previousTargetKeyRef.current === '';
    previousTargetKeyRef.current = nextKey;

    const canAnimate = el.clientWidth > 0 && el.clientHeight > 0 && !mini && !isFirstMove;

    try {
      map.stop?.();
      map.invalidateSize?.({ pan: false });
      if (canAnimate && typeof map.flyTo === 'function') {
        map.flyTo([centerTarget.lat, centerTarget.lng], zoom, {
          animate: true,
          duration: 1.15,
          easeLinearity: 0.22,
        });
      } else {
        map.setView([centerTarget.lat, centerTarget.lng], zoom, { animate: false });
      }
    } catch {
      // ignore JSDOM geometry edge cases
    }
  }, [centerTarget, zoom, flyToTrigger, mini]);

  // 4. Render Pin Kampus, Radius Kampus, Garis Rute, & Pin Interaktif Kos
  useEffect(() => {
    const map = mapRef.current;
    const overlayGroup = overlayGroupRef.current;
    if (!map || !overlayGroup) return;

    overlayGroup.clearLayers();

    // Radius & Pin Kampus Utama
    if (campus && typeof campus.lat === 'number' && typeof campus.lng === 'number' && !mini) {
      L.circle([campus.lat, campus.lng], {
        radius: 950,
        color: '#1d77f2',
        weight: 1.6,
        opacity: 0.55,
        fillColor: '#1d77f2',
        fillOpacity: mapType === 'satellite' ? 0.1 : 0.06,
        dashArray: '6 6',
      }).addTo(overlayGroup);

      const campusIcon = L.divIcon({
        className: 'teralio-leaflet-div-icon',
        html: `
          <div class="teralio-campus-pin" title="${escapeHtml(campus.name)}">
            <span class="teralio-campus-pin__pulse"></span>
            <span class="teralio-campus-pin__core">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </span>
            <span class="teralio-campus-pin__label">${escapeHtml(campus.shortName || campus.name)}</span>
          </div>
        `,
        iconSize: [140, 42],
        iconAnchor: [70, 21],
      });

      L.marker([campus.lat, campus.lng], { icon: campusIcon, zIndexOffset: 200 }).addTo(
        overlayGroup,
      );
    }

    // Polyline Rute Kampus -> Kos Terpilih
    if (showRouteLine && selectedKos && campus && !mini) {
      const pathCoords =
        Array.isArray(route?.geometry) && route.geometry.length >= 2
          ? route.geometry
          : [
              [campus.lat, campus.lng],
              [selectedKos.lat, selectedKos.lng],
            ];

      // Casing putih agar kontras di atas citra satelit maupun jalan raya
      L.polyline(pathCoords, {
        color: '#ffffff',
        weight: 7,
        opacity: 0.88,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(overlayGroup);

      L.polyline(pathCoords, {
        color: '#2563eb',
        weight: 4.2,
        opacity: 0.96,
        dashArray: '10 7',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(overlayGroup);
    }

    // Pin Hunian / Kos
    const itemsToRender = mini
      ? selectedKos
        ? [selectedKos]
        : accommodations.slice(0, 1)
      : accommodations;

    itemsToRender.forEach((kos) => {
      if (typeof kos?.lat !== 'number' || typeof kos?.lng !== 'number') return;
      const isSelected = selectedKos?.id === kos.id;
      const shortPrice = formatShortPrice(kos.priceMonthly ?? kos.priceValue, kos.price);
      const matchBadge = kos.matchScore ? `${kos.matchScore}%` : '';

      const kosIcon = L.divIcon({
        className: 'teralio-leaflet-div-icon',
        html: `
          <button
            type="button"
            class="teralio-kos-pin ${isSelected ? 'is-selected' : ''} ${mini ? 'is-mini' : ''}"
            data-kos-id="${escapeHtml(kos.id)}"
            title="${escapeHtml(kos.name)} — ${escapeHtml(kos.price || shortPrice)}"
          >
            <span class="teralio-kos-pin__price">${escapeHtml(shortPrice)}</span>
            ${
              matchBadge && !mini
                ? `<span class="teralio-kos-pin__match">${escapeHtml(matchBadge)}</span>`
                : ''
            }
            <span class="teralio-kos-pin__stem"></span>
          </button>
        `,
        iconSize: [128, 42],
        iconAnchor: [64, 40],
      });

      const marker = L.marker([kos.lat, kos.lng], {
        icon: kosIcon,
        zIndexOffset: isSelected ? 900 : 400,
      }).addTo(overlayGroup);

      if (onSelectKos && !mini) {
        marker.on('click', () => {
          onSelectKos(kos);
        });
      }
    });
  }, [campus, accommodations, selectedKos, onSelectKos, route, showRouteLine, mapType, mini]);

  return (
    <div
      className={`teralio-inplatform-map-shell ${mini ? 'is-mini' : ''} ${className}`.trim()}
      data-testid={mini ? 'in-platform-mini-map' : 'in-platform-map-canvas'}
      data-map-type={mapType}
      data-lat={centerTarget.lat}
      data-lng={centerTarget.lng}
      data-zoom={zoom}
      data-selected-kos-id={selectedKos?.id || ''}
    >
      <div ref={containerRef} className="teralio-inplatform-map-leaflet" />

      {/* Aksesibilitas & Selector Pin Cepat (membantu screen-reader & pengujian deterministik) */}
      {!mini && accommodations.length > 0 && (
        <div className="sr-only" aria-label="Daftar Pin Lokasi Kos Aktif di Peta">
          {accommodations.map((kos) => (
            <button
              key={kos.id}
              type="button"
              onClick={() => onSelectKos?.(kos)}
              data-testid={`map-pin-${kos.id}`}
            >
              Pilih {kos.name} ({kos.price})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default InPlatformMapCanvas;
