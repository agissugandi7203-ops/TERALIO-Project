import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Layers,
  Compass,
  Sparkles,
  ExternalLink,
  Footprints,
  Bike,
  Star,
  Plus,
  Minus,
  X,
  Building2,
  ListFilter,
  ChevronDown,
  ChevronUp,
  Menu,
} from 'lucide-react';
import ChatComposer from './chat/ChatComposer.jsx';
import '../styles/chat.css';
import {
  getBrowserMapsApiKey,
  loadGoogleMapsSdk,
  fetchMapsBackendStatus,
  searchGooglePlaces,
  computeCampusRoute,
  decodeGooglePolyline,
  estimateDistanceAndEta,
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsStreetViewUrl,
} from '../services/mapsApi.js';

export const CAMPUS_HUBS = [
  {
    id: 'telkom',
    shortName: 'Telkom Univ',
    name: 'Telkom University Bandung',
    address: 'Jl. Telekomunikasi No. 1, Terusan Buahbatu, Bandung',
    lat: -6.9733,
    lng: 107.6305,
  },
  {
    id: 'itb',
    shortName: 'ITB Bandung',
    name: 'Institut Teknologi Bandung (Ganesha)',
    address: 'Jl. Ganesa No. 10, Coblong, Kota Bandung',
    lat: -6.8915,
    lng: 107.6107,
  },
  {
    id: 'ui',
    shortName: 'UI Depok',
    name: 'Universitas Indonesia Depok',
    address: 'Kampus Baru UI Depok, Jawa Barat',
    lat: -6.3628,
    lng: 106.8271,
  },
  {
    id: 'ugm',
    shortName: 'UGM Jogja',
    name: 'Universitas Gadjah Mada Yogyakarta',
    address: 'Bulaksumur, Caturtunggal, Sleman, DIY',
    lat: -7.7713,
    lng: 110.3775,
  },
];

export const CURATED_GEO_KOS = [
  // Telkom University Hub
  {
    id: 'kos-1',
    campusId: 'telkom',
    name: 'Kos Harmoni Sukapura',
    address: 'Jl. Sukapura No. 18, Dayeuhkolot, Bandung',
    lat: -6.9708,
    lng: 107.6334,
    price: 'Rp1.250.000 / bln',
    priceValue: 1250000,
    distance: '650m dari Kampus',
    type: 'Putra / Putri',
    matchScore: 96,
    tag: 'Match 96%',
    rating: 4.9,
    reviews: 48,
    features: ['Kamar Mandi Dalam', 'Wi-Fi 100 Mbps', 'Kasur Springbed', 'Meja Belajar'],
  },
  {
    id: 'kos-2',
    campusId: 'telkom',
    name: 'Sukapura Loft Residence',
    address: 'Jl. Sukapura No. 45, Terusan Buahbatu, Bandung',
    lat: -6.9695,
    lng: 107.6348,
    price: 'Rp1.350.000 / bln',
    priceValue: 1350000,
    distance: '820m dari Kampus',
    type: 'Campur',
    matchScore: 94,
    tag: 'Match 94%',
    rating: 4.8,
    reviews: 36,
    features: ['Water Heater', 'Smart Lock', 'Balkon', 'Dapur Bersama'],
  },
  {
    id: 'kos-3',
    campusId: 'telkom',
    name: 'Bojongsoang Green Suites',
    address: 'Jl. Cikoneng Bojongsoang, Kabupaten Bandung',
    lat: -6.9756,
    lng: 107.6368,
    price: 'Rp1.150.000 / bln',
    priceValue: 1150000,
    distance: '950m dari Kampus',
    type: 'Putri',
    matchScore: 92,
    tag: 'Match 92%',
    rating: 4.7,
    reviews: 29,
    features: ['Listrik Termasuk', 'CCTV 24 Jam', 'Parkir Motor', 'Laundry'],
  },
  {
    id: 'kos-4',
    campusId: 'telkom',
    name: 'PGA Executive Student Kost',
    address: 'Komplek Permata Buah Batu (Gerbang PGA), Bandung',
    lat: -6.9766,
    lng: 107.6309,
    price: 'Rp1.450.000 / bln',
    priceValue: 1450000,
    distance: '380m dari Kampus',
    type: 'Putra',
    matchScore: 98,
    tag: 'Match 98%',
    rating: 4.9,
    reviews: 64,
    features: ['AC', 'Kamar Mandi Dalam', 'Fiber 150 Mbps', 'Akses 24 Jam'],
  },
  {
    id: 'kos-5',
    campusId: 'telkom',
    name: 'Umayah Pavilion Sukabirus',
    address: 'Jl. Umayah II Sukabirus, Citeureup, Bandung',
    lat: -6.9691,
    lng: 107.6286,
    price: 'Rp1.200.000 / bln',
    priceValue: 1200000,
    distance: '540m dari Kampus',
    type: 'Putri',
    matchScore: 95,
    tag: 'Match 95%',
    rating: 4.8,
    reviews: 41,
    features: ['Quiet Study Zone', 'Kamar Mandi Dalam', 'Pantry Bersih', 'CCTV'],
  },
  // ITB Ganesha Hub
  {
    id: 'kos-itb-1',
    campusId: 'itb',
    name: 'Cisitu Indah Smart Kost',
    address: 'Jl. Cisitu Indah VI No. 12, Dago, Bandung',
    lat: -6.8828,
    lng: 107.6114,
    price: 'Rp1.650.000 / bln',
    priceValue: 1650000,
    distance: '890m dari Kampus',
    type: 'Putra / Putri',
    matchScore: 97,
    tag: 'Match 97%',
    rating: 4.9,
    reviews: 52,
    features: ['Water Heater', 'Wi-Fi 100 Mbps', 'Meja Gambar/Kerja', 'Rooftop'],
  },
  {
    id: 'kos-itb-2',
    campusId: 'itb',
    name: 'Pelesiran Ganesha Suites',
    address: 'Jl. Pelesiran No. 28, Tamansari, Bandung',
    lat: -6.8962,
    lng: 107.6079,
    price: 'Rp1.300.000 / bln',
    priceValue: 1300000,
    distance: '610m dari Kampus',
    type: 'Putri',
    matchScore: 93,
    tag: 'Match 93%',
    rating: 4.8,
    reviews: 33,
    features: ['Kamar Mandi Dalam', 'Dekat Gerbang Selatan', 'CCTV 24 Jam'],
  },
  // UI Depok Hub
  {
    id: 'kos-ui-1',
    campusId: 'ui',
    name: 'Kukusan Teknik Green Kost',
    address: 'Jl. Juragan Sinda, Kukusan, Beji, Depok',
    lat: -6.3612,
    lng: 106.8208,
    price: 'Rp1.400.000 / bln',
    priceValue: 1400000,
    distance: '480m dari FT UI',
    type: 'Putra / Putri',
    matchScore: 97,
    tag: 'Match 97%',
    rating: 4.9,
    reviews: 59,
    features: ['AC', 'Kamar Mandi Dalam', 'Wi-Fi Cepat', 'Akses Gerbang Kutek'],
  },
  {
    id: 'kos-ui-2',
    campusId: 'ui',
    name: 'Pondok Cina Station Loft',
    address: 'Jl. Margonda Raya Gg. Kober, Pondok Cina, Depok',
    lat: -6.3685,
    lng: 106.8325,
    price: 'Rp1.250.000 / bln',
    priceValue: 1250000,
    distance: '520m dari Stasiun Pocin',
    type: 'Putri',
    matchScore: 94,
    tag: 'Match 94%',
    rating: 4.7,
    reviews: 44,
    features: ['Dekat KRL', 'Smart Lock', 'Kasur Orthopedic', 'Dapur Bersama'],
  },
  // UGM Jogja Hub
  {
    id: 'kos-ugm-1',
    campusId: 'ugm',
    name: 'Pogung Dalangan Exclusive',
    address: 'Pogung Dalangan SIA XVI, Sinduadi, Mlati, Sleman',
    lat: -7.7634,
    lng: 110.3742,
    price: 'Rp1.350.000 / bln',
    priceValue: 1350000,
    distance: '620m dari Kampus',
    type: 'Putra / Putri',
    matchScore: 98,
    tag: 'Match 98%',
    rating: 4.9,
    reviews: 71,
    features: ['AC', 'Kamar Mandi Dalam', 'Fiber Wi-Fi', 'Parkir Luas'],
  },
  {
    id: 'kos-ugm-2',
    campusId: 'ugm',
    name: 'Sendowo Quiet Scholar House',
    address: 'Jl. Kesehatan Sendowo, Sekip, Yogyakarta',
    lat: -7.7745,
    lng: 110.3718,
    price: 'Rp1.100.000 / bln',
    priceValue: 1100000,
    distance: '450m dari FKKMK UGM',
    type: 'Putri',
    matchScore: 95,
    tag: 'Match 95%',
    rating: 4.8,
    reviews: 38,
    features: ['Tenang & Asri', 'Kamar Mandi Dalam', 'Dapur & Kulkas', 'CCTV'],
  },
];

const FILTER_CHIPS = [
  { id: 'all', label: 'Semua' },
  { id: 'putri', label: 'Putri' },
  { id: 'putra', label: 'Putra' },
  { id: 'budget', label: '≤ Rp1,3 Jt' },
  { id: 'top', label: 'Match 95%+' },
];

const parsePriceValue = (priceStr) => {
  if (!priceStr) return 1250000;
  const digits = String(priceStr).replace(/[^0-9]/g, '');
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1250000;
};

export const SmartKosMapView = ({
  externalListings = [],
  globalSearchQuery = '',
  onGlobalSearchChange,
  isSidebarExpanded = false,
  onOpenMobileMenu,
  onBackToOverview,
  onAskAi,
}) => {
  const [selectedCampusId, setSelectedCampusId] = useState('telkom');
  const [activeFilter, setActiveFilter] = useState('all');
  const [mapType, setMapType] = useState('satellite'); // Default mode: satellite ('satellite' | 'roadmap')
  const [zoom, setZoom] = useState(16);

  // Full 1-Page Maps by default: side drawer is closed unless user toggles it!
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Floating Chat AI state
  const [chatInput, setChatInput] = useState('');
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [chatAttachments, setChatAttachments] = useState([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [aiReply, setAiReply] = useState(null);

  const [mapSearchInput, setMapSearchInput] = useState(globalSearchQuery || '');
  const [committedMapQuery, setCommittedMapQuery] = useState('');
  const [livePlaces, setLivePlaces] = useState([]);
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [backendMapsReady, setBackendMapsReady] = useState(false);
  const [routeMetrics, setRouteMetrics] = useState(null);

  const browserApiKey = useMemo(() => getBrowserMapsApiKey(), []);
  const [sdkEngineActive, setSdkEngineActive] = useState(false);
  const sdkMapContainerRef = useRef(null);
  const sdkMapInstanceRef = useRef(null);
  const sdkOverlaysRef = useRef([]);

  const selectedCampus = useMemo(
    () => CAMPUS_HUBS.find((c) => c.id === selectedCampusId) || CAMPUS_HUBS[0],
    [selectedCampusId]
  );

  useEffect(() => {
    setMapSearchInput(globalSearchQuery || '');
  }, [globalSearchQuery]);

  useEffect(() => {
    let active = true;
    fetchMapsBackendStatus().then((status) => {
      if (active) setBackendMapsReady(Boolean(status?.configured));
    });
    return () => {
      active = false;
    };
  }, []);

  const mergedListings = useMemo(() => {
    if (livePlaces.length > 0) {
      return livePlaces;
    }

    const campusBase = CURATED_GEO_KOS.filter((k) => k.campusId === selectedCampus.id);
    const knownNames = new Set(campusBase.map((k) => k.name.toLowerCase()));

    const extras =
      selectedCampus.id === 'telkom'
        ? (externalListings || [])
            .filter((item) => {
              const nm = (item.name || item.title || '').trim().toLowerCase();
              return nm && !knownNames.has(nm);
            })
            .map((item, idx) => ({
              id: item.id || `ext-kos-${idx}`,
              campusId: 'telkom',
              name: item.name || item.title,
              address: item.address || item.description || selectedCampus.address,
              lat:
                typeof item.lat === 'number'
                  ? item.lat
                  : selectedCampus.lat + (idx % 2 === 0 ? 0.0022 : -0.0024),
              lng:
                typeof item.lng === 'number'
                  ? item.lng
                  : selectedCampus.lng + (idx % 2 === 0 ? 0.0028 : -0.0021),
              price: item.price || 'Rp1.250.000 / bln',
              priceValue: parsePriceValue(item.price),
              distance: item.distance || '700m dari Kampus',
              type: item.type || 'Putra / Putri',
              matchScore: 93,
              tag: item.tag || item.category || 'Match 93%',
              rating: 4.8,
              reviews: 24,
              features: item.features || ['Wi-Fi Cepat', 'Kamar Mandi Dalam'],
            }))
        : [];

    return [...campusBase, ...extras];
  }, [livePlaces, selectedCampus, externalListings]);

  const filteredKos = useMemo(() => {
    const q = (globalSearchQuery || '').trim().toLowerCase();
    return mergedListings.filter((item) => {
      if (activeFilter === 'putri' && !String(item.type).toLowerCase().includes('putri')) {
        return false;
      }
      if (activeFilter === 'putra' && !String(item.type).toLowerCase().includes('putra')) {
        return false;
      }
      if (activeFilter === 'budget' && (item.priceValue || 0) > 1300000) {
        return false;
      }
      if (activeFilter === 'top' && (item.matchScore || 90) < 95) {
        return false;
      }
      if (q && livePlaces.length === 0) {
        const hay = `${item.name} ${item.address || ''} ${item.type || ''} ${(
          item.features || []
        ).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [mergedListings, activeFilter, globalSearchQuery, livePlaces.length]);

  const [selectedKosId, setSelectedKosId] = useState(() => CURATED_GEO_KOS[0].id);

  const selectedKos = useMemo(() => {
    return (
      filteredKos.find((k) => k.id === selectedKosId) ||
      filteredKos[0] ||
      mergedListings[0] ||
      null
    );
  }, [filteredKos, mergedListings, selectedKosId]);

  useEffect(() => {
    if (filteredKos.length > 0 && !filteredKos.some((k) => k.id === selectedKosId)) {
      setSelectedKosId(filteredKos[0].id);
    }
  }, [filteredKos, selectedKosId]);

  useEffect(() => {
    if (!selectedKos) {
      setRouteMetrics(null);
      return undefined;
    }

    let cancelled = false;
    const fallback = estimateDistanceAndEta(selectedCampus, selectedKos);
    setRouteMetrics({ ...fallback, encodedPolyline: null, source: 'geo-estimate' });

    if (backendMapsReady) {
      computeCampusRoute({
        origin: { lat: selectedCampus.lat, lng: selectedCampus.lng },
        destination: { lat: selectedKos.lat, lng: selectedKos.lng },
        travelMode: 'WALK',
      }).then((res) => {
        if (cancelled || !res.ok || !res.route) return;
        const meters = res.route.distanceMeters || fallback.distanceMeters;
        const secs = res.route.durationSeconds || fallback.walkMinutes * 60;
        setRouteMetrics({
          distanceMeters: meters,
          distanceText:
            res.route.distanceText ||
            (meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`),
          walkMinutes: Math.max(1, Math.round(secs / 60)),
          rideMinutes: Math.max(1, Math.round(meters / 360)),
          encodedPolyline: res.route.encodedPolyline || null,
          source: 'google-routes-api',
        });
      });
    }

    return () => {
      cancelled = true;
    };
  }, [selectedCampus, selectedKos, backendMapsReady]);

  // Native Google Maps JS SDK initialization when VITE_GOOGLE_MAPS_BROWSER_API_KEY is configured
  useEffect(() => {
    if (!browserApiKey) {
      setSdkEngineActive(false);
      return undefined;
    }

    let mounted = true;
    const handleAuthError = () => {
      if (mounted) setSdkEngineActive(false);
    };
    window.addEventListener('teralio:gmaps-auth-error', handleAuthError);

    loadGoogleMapsSdk(browserApiKey)
      .then((gmaps) => {
        if (!mounted || !sdkMapContainerRef.current) return;
        setSdkEngineActive(true);

        if (!sdkMapInstanceRef.current) {
          sdkMapInstanceRef.current = new gmaps.Map(sdkMapContainerRef.current, {
            center: { lat: selectedCampus.lat, lng: selectedCampus.lng },
            zoom,
            mapTypeId: mapType === 'satellite' ? 'hybrid' : 'roadmap',
            mapTypeControl: false,
            streetViewControl: true,
            fullscreenControl: false,
            zoomControl: false,
          });
        }
      })
      .catch(() => {
        if (mounted) setSdkEngineActive(false);
      });

    return () => {
      mounted = false;
      window.removeEventListener('teralio:gmaps-auth-error', handleAuthError);
    };
  }, [browserApiKey]);

  useEffect(() => {
    if (!sdkEngineActive || !sdkMapInstanceRef.current || !window.google?.maps) return;
    const gmaps = window.google.maps;
    const map = sdkMapInstanceRef.current;

    sdkOverlaysRef.current.forEach((ov) => ov?.setMap && ov.setMap(null));
    sdkOverlaysRef.current = [];

    map.setMapTypeId(mapType === 'satellite' ? 'hybrid' : 'roadmap');
    const targetCenter = selectedKos
      ? { lat: selectedKos.lat, lng: selectedKos.lng }
      : { lat: selectedCampus.lat, lng: selectedCampus.lng };
    map.panTo(targetCenter);
    map.setZoom(zoom);

    const campusCircle = new gmaps.Circle({
      map,
      center: { lat: selectedCampus.lat, lng: selectedCampus.lng },
      radius: 1000,
      fillColor: '#1d77f2',
      fillOpacity: 0.08,
      strokeColor: '#1d77f2',
      strokeOpacity: 0.35,
      strokeWeight: 1.5,
    });
    const campusMarker = new gmaps.Marker({
      map,
      position: { lat: selectedCampus.lat, lng: selectedCampus.lng },
      title: selectedCampus.name,
      label: { text: '🎓', fontSize: '15px' },
    });
    sdkOverlaysRef.current.push(campusCircle, campusMarker);

    filteredKos.forEach((kos) => {
      const isSelected = selectedKos?.id === kos.id;
      const marker = new gmaps.Marker({
        map,
        position: { lat: kos.lat, lng: kos.lng },
        title: `${kos.name} — ${kos.price}`,
        label: {
          text: `${kos.matchScore || 95}%`,
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '11px',
        },
        zIndex: isSelected ? 20 : 5,
      });
      marker.addListener('click', () => {
        setCommittedMapQuery('');
        setSelectedKosId(kos.id);
        setZoom(17);
      });
      sdkOverlaysRef.current.push(marker);
    });

    if (selectedKos) {
      const pathPoints = routeMetrics?.encodedPolyline
        ? decodeGooglePolyline(routeMetrics.encodedPolyline)
        : [
            { lat: selectedCampus.lat, lng: selectedCampus.lng },
            { lat: selectedKos.lat, lng: selectedKos.lng },
          ];
      const routeLine = new gmaps.Polyline({
        map,
        path: pathPoints,
        geodesic: true,
        strokeColor: '#8fa924',
        strokeOpacity: 0.92,
        strokeWeight: 4,
      });
      sdkOverlaysRef.current.push(routeLine);
    }
  }, [sdkEngineActive, selectedCampus, filteredKos, selectedKos, mapType, zoom, routeMetrics]);

  const handleMapSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const q = mapSearchInput.trim();
    if (!q) {
      handleClearMapSearch();
      return;
    }

    if (onGlobalSearchChange) onGlobalSearchChange(q);
    setIsSearchingMaps(true);

    const searchQueryWithContext = /kos|kost|boarding|asrama|apartemen/i.test(q)
      ? q
      : `Kos dekat ${q}`;

    const result = await searchGooglePlaces({
      query: searchQueryWithContext,
      lat: selectedCampus.lat,
      lng: selectedCampus.lng,
      radiusMeters: 4000,
      maxResults: 10,
    });

    setIsSearchingMaps(false);

    if (result.ok && result.places.length > 0) {
      const mapped = result.places
        .filter((p) => p.location && typeof p.location.lat === 'number')
        .map((p, idx) => {
          const matchScore = Math.max(88, 98 - idx * 2);
          return {
            id: p.id || `gplace-${idx}`,
            campusId: selectedCampus.id,
            name: p.name || `Kos Pilihan #${idx + 1}`,
            address: p.shortAddress || p.address || selectedCampus.address,
            lat: p.location.lat,
            lng: p.location.lng,
            price: 'Cek Tarif via Maps / AI',
            priceValue: 1250000,
            distance: estimateDistanceAndEta(selectedCampus, p.location).distanceText,
            type: 'Putra / Putri',
            matchScore,
            tag: `Match ${matchScore}%`,
            rating: p.rating || 4.7,
            reviews: p.userRatingCount || 19,
            googleMapsUri: p.googleMapsUri || null,
            features: ['Google Maps Verified', 'Lokasi Akurat', 'Akses Kampus'],
          };
        });

      if (mapped.length > 0) {
        setLivePlaces(mapped);
        setCommittedMapQuery('');
        setSelectedKosId(mapped[0].id);
        setZoom(16);
        return;
      }
    }

    const localMatch = mergedListings.find((item) =>
      `${item.name} ${item.address}`.toLowerCase().includes(q.toLowerCase())
    );
    if (localMatch) {
      setCommittedMapQuery('');
      setSelectedKosId(localMatch.id);
      setZoom(17);
    } else {
      setCommittedMapQuery(searchQueryWithContext);
      setZoom(15);
    }
  };

  const handleClearMapSearch = () => {
    setMapSearchInput('');
    setCommittedMapQuery('');
    setLivePlaces([]);
    if (onGlobalSearchChange) onGlobalSearchChange('');
    setZoom(16);
  };

  const handleSelectCampus = (campusId) => {
    setSelectedCampusId(campusId);
    setLivePlaces([]);
    setCommittedMapQuery('');
    const firstForCampus = CURATED_GEO_KOS.find((k) => k.campusId === campusId);
    if (firstForCampus) {
      setSelectedKosId(firstForCampus.id);
    }
    setZoom(16);
  };

  const handleSelectKos = (kos) => {
    setCommittedMapQuery('');
    setSelectedKosId(kos.id);
    setZoom(17);
  };

  const handleSelectChatFiles = (files, category) => {
    const newFiles = Array.from(files || []).map((f) => ({
      localId: `map-att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file: f,
      filename: f.name || 'lampiran',
      kind: category === 'image' || f.type?.startsWith('image/') ? 'image' : 'file',
      status: 'ready',
    }));
    setChatAttachments((prev) => [...prev, ...newFiles].slice(0, 4));
  };

  const handleRemoveChatAttachment = (localId) => {
    setChatAttachments((prev) => prev.filter((att) => att.localId !== localId));
  };

  const handleSendChatMessage = async (customPrompt) => {
    const promptToSend = (typeof customPrompt === 'string' ? customPrompt : chatInput).trim();
    if (!promptToSend) return;

    setIsAiResponding(true);
    setChatInput('');

    try {
      const res = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          userContext: {
            campus: selectedCampus.name,
            activeFilter,
          },
        }),
      });
      const payload = await res.json().catch(() => ({}));
      const replyText = payload?.data?.reply || payload?.reply;

      const lowerPrompt = promptToSend.toLowerCase();
      const matchedKos =
        filteredKos.find(
          (k) =>
            lowerPrompt.includes(k.name.toLowerCase()) ||
            (lowerPrompt.includes('putri') && k.type.toLowerCase().includes('putri')) ||
            (lowerPrompt.includes('putra') && k.type.toLowerCase().includes('putra')) ||
            (lowerPrompt.includes('murah') && (k.priceValue || 0) <= 1250000)
        ) || filteredKos[0] || selectedKos;

      if (matchedKos) {
        setSelectedKosId(matchedKos.id);
        setZoom(17);
      }

      setAiReply({
        prompt: promptToSend,
        text:
          replyText ||
          `Berdasarkan pencarian Anda di sekitar ${selectedCampus.name}, rekomendasi terbaik adalah ${matchedKos?.name || 'Kos Harmoni Sukapura'} (${matchedKos?.price || 'Rp1.250.000/bln'}, ${matchedKos?.distance || 'dekat kampus'}). Fasilitas: ${(matchedKos?.features || ['Wi-Fi Cepat', 'Kamar Mandi Dalam']).join(', ')}.`,
        suggestedKos: matchedKos,
      });
    } catch {
      const lowerPrompt = promptToSend.toLowerCase();
      const matchedKos =
        filteredKos.find(
          (k) =>
            lowerPrompt.includes(k.name.toLowerCase()) ||
            (lowerPrompt.includes('putri') && k.type.toLowerCase().includes('putri')) ||
            (lowerPrompt.includes('putra') && k.type.toLowerCase().includes('putra')) ||
            (lowerPrompt.includes('murah') && (k.priceValue || 0) <= 1250000)
        ) || filteredKos[0] || selectedKos;

      if (matchedKos) {
        setSelectedKosId(matchedKos.id);
        setZoom(17);
      }

      setAiReply({
        prompt: promptToSend,
        text: `Rekomendasi TERALIO AI untuk ${selectedCampus.name}: ${matchedKos?.name || 'Kos Harmoni Sukapura'} (${matchedKos?.price || 'Rp1.250.000/bln'}, ${matchedKos?.distance || 'dekat kampus'}). Fasilitas: ${(matchedKos?.features || ['Wi-Fi Cepat', 'Kamar Mandi Dalam']).join(', ')}.`,
        suggestedKos: matchedKos,
      });
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleResetToCampus = () => {
    setCommittedMapQuery(`${selectedCampus.name}`);
    setZoom(15);
  };

  const googleMapsEmbedUrl = useMemo(() => {
    if (committedMapQuery) {
      return buildGoogleMapsEmbedUrl({
        query: committedMapQuery,
        zoom,
        mapType,
      });
    }
    if (selectedKos) {
      return buildGoogleMapsEmbedUrl({
        lat: selectedKos.lat,
        lng: selectedKos.lng,
        zoom,
        mapType,
      });
    }
    return buildGoogleMapsEmbedUrl({
      lat: selectedCampus.lat,
      lng: selectedCampus.lng,
      zoom,
      mapType,
    });
  }, [committedMapQuery, selectedKos, selectedCampus, zoom, mapType]);

  const directionsUrl = useMemo(
    () =>
      selectedKos
        ? buildGoogleMapsDirectionsUrl({
            origin: selectedCampus,
            destination: selectedKos,
            travelMode: 'walking',
          })
        : 'https://www.google.com/maps',
    [selectedCampus, selectedKos]
  );

  const streetViewUrl = useMemo(
    () =>
      selectedKos
        ? buildGoogleMapsStreetViewUrl({ lat: selectedKos.lat, lng: selectedKos.lng })
        : 'https://www.google.com/maps',
    [selectedKos]
  );

  return (
    <section
      className={`fullpage-gmaps-root ${isSidebarExpanded ? 'sidebar-is-expanded' : 'sidebar-is-minimized'}`}
      data-testid="subview-discovery"
      aria-label="Smart Kos Match Full-Page Google Maps"
    >
      {/* Accessible Hidden Heading for Screen Readers & Test Compatibility */}
      <h2 className="sr-only">Smart Kos Match &amp; Listings</h2>

      {/* 100vw x 100vh EDGE-TO-EDGE GOOGLE MAPS CANVAS */}
      <div className="fullpage-gmaps-canvas-wrap" data-testid="smart-kos-google-map">
        {browserApiKey && sdkEngineActive ? (
          <div
            ref={sdkMapContainerRef}
            className="google-maps-canvas"
            data-testid="google-maps-sdk-canvas"
          />
        ) : (
          <iframe
            key={googleMapsEmbedUrl}
            src={googleMapsEmbedUrl}
            title="Google Maps Smart Kos Match"
            className="google-maps-iframe"
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            data-testid="google-maps-iframe"
          />
        )}

        {/* FLOATING TOP-LEFT: Mobile Menu Button (if present) */}
        {onOpenMobileMenu && (
          <div className="fullmap-hud-topleft">
            <button
              type="button"
              className="fullmap-mobile-menu-btn"
              onClick={onOpenMobileMenu}
              aria-label="Buka Menu Navigasi"
            >
              <Menu size={18} />
            </button>
          </div>
        )}

        {/* FLOATING TOP-RIGHT: Layer Toggle, Recenter, Zoom */}
        <div className="fullmap-hud-topright" role="toolbar" aria-label="Kontrol Google Maps">
          <div className="fullmap-topright-bar">
            <div className="map-layer-toggle">
              <button
                type="button"
                className={`map-layer-btn ${mapType === 'roadmap' ? 'is-active' : ''}`}
                onClick={() => setMapType('roadmap')}
                data-testid="map-type-roadmap"
              >
                <Layers size={13} />
                <span>Peta</span>
              </button>
              <button
                type="button"
                className={`map-layer-btn ${mapType === 'satellite' ? 'is-active' : ''}`}
                onClick={() => setMapType('satellite')}
                data-testid="map-type-satellite"
              >
                <span>Satelit</span>
              </button>
            </div>
          </div>

          <div className="map-zoom-stack">
            <button
              type="button"
              className="map-icon-ctrl-btn"
              onClick={() => setZoom((z) => Math.min(20, z + 1))}
              title="Perbesar Peta (Zoom In)"
              aria-label="Zoom in Google Maps"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="map-icon-ctrl-btn"
              onClick={() => setZoom((z) => Math.max(12, z - 1))}
              title="Perkecil Peta (Zoom Out)"
              aria-label="Zoom out Google Maps"
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              className="map-icon-ctrl-btn"
              onClick={handleResetToCampus}
              title={`Pusatkan ke ${selectedCampus.name}`}
              aria-label="Pusatkan ke Kampus"
              data-testid="map-recenter-campus-btn"
            >
              <Compass size={16} />
            </button>
          </div>
        </div>

        {/* OPTIONAL FLOATING KOS LIST OVERLAY DRAWER (Appears over map only when toggled) */}
        {isDrawerOpen && (
          <aside className="fullmap-floating-drawer" aria-label="Daftar Smart Kos Match">
            <div className="map-drawer-header">
              <div>
                <span className="map-drawer-header__label">Smart Kos Match</span>
                <h4>{selectedCampus.name}</h4>
              </div>
              <button
                type="button"
                className="map-search-clear-btn"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Tutup daftar kos"
              >
                <X size={15} />
              </button>
            </div>

            <div className="map-drawer-list">
              {filteredKos.length === 0 ? (
                <div className="map-empty-state">
                  <MapPin size={28} />
                  <p>Tidak ada kos yang cocok dengan filter saat ini.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter('all');
                      handleClearMapSearch();
                    }}
                  >
                    Reset Filter Peta
                  </button>
                </div>
              ) : (
                filteredKos.map((item) => {
                  const active = selectedKos?.id === item.id;
                  const eta = estimateDistanceAndEta(selectedCampus, item);
                  return (
                    <article
                      key={item.id}
                      className={`map-kos-card ${active ? 'is-selected' : ''}`}
                      onClick={() => handleSelectKos(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectKos(item);
                        }
                      }}
                      data-testid={`drawer-kos-card-${item.id}`}
                    >
                      <div className="map-kos-card__top">
                        <span className="kos-tag">{item.tag || `Match ${item.matchScore}%`}</span>
                        <strong className="kos-price">{item.price}</strong>
                      </div>

                      <div className="map-kos-card__body">
                        <h5>{item.name}</h5>
                        <p className="map-kos-card__sub">
                          {eta.distanceText} • ~{eta.walkMinutes} mnt jalan kaki • {item.type}
                        </p>
                      </div>

                      <div className="map-kos-card__chips">
                        {(item.features || []).slice(0, 3).map((feat, i) => (
                          <span key={i} className="map-kos-mini-chip">
                            {feat}
                          </span>
                        ))}
                      </div>

                      <div className="map-kos-card__footer">
                        <span className="map-focus-indicator">
                          <MapPin size={13} />
                          {active ? 'Aktif di Google Maps' : 'Fokus ke Peta'}
                        </span>
                        <button
                          type="button"
                          className="map-kos-ai-mini-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onAskAi) {
                              onAskAi(`Tanyakan detail ketersediaan untuk ${item.name}`);
                            }
                          }}
                        >
                          Tanya AI →
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* FLOATING BOTTOM CENTER CHAT AI (Styled identical to Chat Workspace & Gemini reference) */}
        <div className="fullmap-hud-bottom" role="region" aria-label="AI Chat Asisten Kos di Peta">
          <div className="fullmap-chat-dock">
            {/* Floating AI Reply Bubble when active */}
            {aiReply && (
              <div className="fullmap-ai-reply-card" data-testid="fullmap-ai-reply">
                <div className="fullmap-ai-reply-header">
                  <div className="fullmap-ai-reply-title">
                    <span className="fullmap-ai-reply-badge">
                      <Sparkles size={13} />
                      TERALIO AI
                    </span>
                    {thinkingEnabled && <span className="fullmap-ai-thinking-tag">Thinking Active</span>}
                  </div>
                  <button
                    type="button"
                    className="fullmap-ai-reply-close"
                    onClick={() => setAiReply(null)}
                    aria-label="Tutup jawaban AI"
                  >
                    <X size={15} />
                  </button>
                </div>
                <p className="fullmap-ai-reply-body">{aiReply.text}</p>
                {aiReply.suggestedKos && (
                  <div className="fullmap-ai-reply-footer">
                    <button
                      type="button"
                      className="fullmap-ai-kos-chip"
                      onClick={() => handleSelectKos(aiReply.suggestedKos)}
                    >
                      <MapPin size={12} />
                      <span>Fokus {aiReply.suggestedKos.name} ({aiReply.suggestedKos.price})</span>
                    </button>
                    {onAskAi && (
                      <button
                        type="button"
                        className="fullmap-ai-jump-chat-btn"
                        onClick={() => onAskAi(aiReply.prompt || aiReply.text)}
                      >
                        Buka di Chat Penuh →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Minimalist Chat Composer identical to Chat Workspace */}
            <div className="fullmap-composer-container">
              <ChatComposer
                value={chatInput}
                onChange={setChatInput}
                onSubmit={handleSendChatMessage}
                onStopStreaming={() => setIsAiResponding(false)}
                onOpenVoice={() => onAskAi?.('Buka percakapan suara TERALIO AI')}
                thinkingEnabled={thinkingEnabled}
                onToggleThinking={setThinkingEnabled}
                attachments={chatAttachments}
                onSelectFiles={handleSelectChatFiles}
                onRemoveAttachment={handleRemoveChatAttachment}
                isStreaming={isAiResponding}
                placeholder="Minta Teralio AI seputar kos di peta..."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SmartKosMapView;
