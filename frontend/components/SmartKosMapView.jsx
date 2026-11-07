import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Layers, Menu, Minus, Plus } from 'lucide-react';
import ChatComposer from './chat/ChatComposer.jsx';
import InPlatformMapCanvas from './map/InPlatformMapCanvas.jsx';
import KosPlaceOverviewCard from './map/KosPlaceOverviewCard.jsx';
import SmartKosAiSidebar from './map/SmartKosAiSidebar.jsx';
import { chatApi } from '../services/chatApi.js';
import { smartKosApi } from '../services/smartKosApi.js';
import { findMentionedKosInText } from '../utils/kosVoiceMatcher.js';
import '../styles/chat.css';
import '../styles/smart-kos.css';

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
    id: 'utb',
    shortName: 'UTB Bandung',
    name: 'Universitas Teknologi Bandung (UTB)',
    address: 'Jl. Soekarno-Hatta No. 378, Kebon Lega, Bojongloa Kidul, Kota Bandung',
    lat: -6.9482,
    lng: 107.6011,
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

export const SmartKosMapView = ({
  user = null,
  externalListings = [],
  globalSearchQuery = '',
  isSidebarExpanded = false,
  onOpenMobileMenu,
  focusTarget = null,
  onConsumeFocusTarget,
  onSurveyBooked,
  onOpenSchedulePage,
  onCatalogLoaded,
  onCampusChanged,
  sharedAiAssistant = null,
}) => {
  const [campusHubsMap, setCampusHubsMap] = useState(() =>
    Object.fromEntries(CAMPUS_HUBS.map((c) => [c.id, c])),
  );
  const [selectedCampusId, setSelectedCampusId] = useState('telkom');
  const [catalogItems, setCatalogItems] = useState([]);

  const [mapType, setMapType] = useState('satellite');
  const [zoom, setZoom] = useState(16);
  const [flyToTrigger, setFlyToTrigger] = useState(0);

  // Selected Kos & Native Clean Google-Maps Place Overview Card
  const [selectedKos, setSelectedKos] = useState(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [showRouteLine, setShowRouteLine] = useState(true);

  // Standalone fallback state (aktif saat SmartKosMapView dirender mandiri tanpa DashboardPage)
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false);
  const [localVoiceOpen, setLocalVoiceOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [localIsStreaming, setLocalIsStreaming] = useState(false);
  const [localOrbStatus, setLocalOrbStatus] = useState(null);
  const [localChatInput, setLocalChatInput] = useState('');
  const [localThinking, setLocalThinking] = useState(false);
  const [localAttachments, setLocalAttachments] = useState([]);

  const streamAbortRef = useRef(null);
  const lastToolRedirectAtRef = useRef(0);

  const isAiSidebarOpen = sharedAiAssistant ? sharedAiAssistant.isOpen : localSidebarOpen;
  const chatInput = sharedAiAssistant ? sharedAiAssistant.composerValue : localChatInput;
  const setChatInput = sharedAiAssistant ? sharedAiAssistant.setComposerValue : setLocalChatInput;
  const thinkingEnabled = sharedAiAssistant ? sharedAiAssistant.thinkingEnabled : localThinking;
  const setThinkingEnabled = sharedAiAssistant
    ? sharedAiAssistant.setThinkingEnabled
    : setLocalThinking;
  const chatAttachments = sharedAiAssistant ? sharedAiAssistant.attachments : localAttachments;
  const isStreamingAi = sharedAiAssistant ? sharedAiAssistant.isStreaming : localIsStreaming;

  const selectedCampus = useMemo(
    () => (selectedCampusId !== 'all' && campusHubsMap[selectedCampusId]) || CAMPUS_HUBS[0],
    [campusHubsMap, selectedCampusId],
  );

  useEffect(() => {
    onCampusChanged?.(selectedCampus);
  }, [selectedCampus, onCampusChanged]);

  // 1. Muat katalog kos dari backend (`/api/accommodations`)
  useEffect(() => {
    const controller = new AbortController();
    smartKosApi
      .fetchAccommodations({ signal: controller.signal })
      .then((res) => {
        if (res.campusHubs && typeof res.campusHubs === 'object') {
          setCampusHubsMap((prev) => ({ ...prev, ...res.campusHubs }));
        }
        if (Array.isArray(res.items) && res.items.length > 0) {
          setCatalogItems(res.items);
          onCatalogLoaded?.(res.items);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [onCatalogLoaded]);

  const visibleAccommodations = useMemo(() => {
    const campusItems =
      selectedCampusId === 'all'
        ? catalogItems
        : catalogItems.filter((item) => item.campusId === selectedCampusId);
    const baseList = campusItems.length > 0 ? campusItems : catalogItems;

    const knownIds = new Set(baseList.map((k) => k.id));
    const extras = (externalListings || [])
      .filter((ext) => ext && (ext.name || ext.title) && !knownIds.has(ext.id))
      .filter((ext) => {
        const cat = String(ext.category || '').toLowerCase();
        return !['frontend', 'backend', 'database', 'general'].includes(cat);
      })
      .map((ext, idx) => ({
        id: ext.id || `ext-kos-${idx}`,
        campusId: selectedCampusId,
        name: ext.name || ext.title,
        address: ext.address || ext.description || selectedCampus.address,
        lat:
          typeof ext.lat === 'number'
            ? ext.lat
            : selectedCampus.lat + (idx % 2 === 0 ? 0.0021 : -0.0021),
        lng:
          typeof ext.lng === 'number'
            ? ext.lng
            : selectedCampus.lng + (idx % 2 === 0 ? 0.0025 : -0.0022),
        price: ext.price || 'Rp1.250.000 / bln',
        priceMonthly: ext.priceMonthly || 1250000,
        distance: ext.distance || '650m dari Kampus',
        type: ext.type || 'Putra / Putri',
        matchScore: ext.matchScore || 94,
        tag: ext.tag || 'Match 94%',
        rating: typeof ext.rating === 'number' ? ext.rating : 4.8,
        features: Array.isArray(ext.features) ? ext.features : ['Wi-Fi Cepat', 'Kamar Mandi Dalam'],
        contact: ext.contact || null,
      }));

    let combined = [...baseList, ...extras];
    if (selectedKos && !combined.some((item) => item.id === selectedKos.id)) {
      combined = [selectedKos, ...combined];
    }

    const q = (globalSearchQuery || '').trim().toLowerCase();
    if (!q) return combined;
    const filtered = combined.filter((item) =>
      `${item.name} ${item.address || ''} ${item.type || ''} ${(item.features || []).join(' ')}`
        .toLowerCase()
        .includes(q),
    );
    return filtered.length > 0 ? filtered : combined;
  }, [catalogItems, selectedCampusId, externalListings, selectedCampus, selectedKos, globalSearchQuery]);

  const loadDynamicRouteForKos = useCallback(async (kosTarget, campusTarget) => {
    if (
      !kosTarget ||
      typeof kosTarget.lat !== 'number' ||
      typeof kosTarget.lng !== 'number' ||
      !campusTarget
    ) {
      return;
    }

    const routeData = await smartKosApi.fetchCampusRoute({
      origin: { lat: campusTarget.lat, lng: campusTarget.lng },
      destination: { lat: kosTarget.lat, lng: kosTarget.lng },
      mode: 'foot',
    });
    if (routeData) {
      setActiveRoute(routeData);
    }
  }, []);

  // Handler memilih pin kos pada peta -> langsung flyTo & buka Overview Google-Maps-Style
  const handleSelectKos = useCallback(
    (kosItem, { customRoute = null, targetCampusId = null } = {}) => {
      if (!kosItem) return;
      const nextCampusId = targetCampusId || kosItem.campusId || selectedCampusId;
      if (nextCampusId && campusHubsMap[nextCampusId]) {
        setSelectedCampusId(nextCampusId);
      }

      setSelectedKos(kosItem);
      setIsOverviewOpen(true);
      setShowRouteLine(true);
      setZoom(18);
      setFlyToTrigger((n) => n + 1);

      if (customRoute) {
        setActiveRoute(customRoute);
      } else {
        const hub = campusHubsMap[nextCampusId] || selectedCampus;
        loadDynamicRouteForKos(kosItem, hub);
      }
    },
    [selectedCampusId, campusHubsMap, selectedCampus, loadDynamicRouteForKos],
  );

  // Konsumsi target lokasi dari halaman lain (Chat / Visit Schedule / Cross-page Voice)
  useEffect(() => {
    if (!focusTarget) return;

    const rawId = String(
      focusTarget.rawId || focusTarget.accommodationId || focusTarget.id || '',
    ).replace(/^teralio:/, '');
    const targetName = String(
      focusTarget.name || focusTarget.accommodationName || '',
    ).toLowerCase();

    const matchedFromCatalog = catalogItems.find(
      (k) => k.id === rawId || (targetName && k.name.toLowerCase() === targetName),
    );

    if (matchedFromCatalog) {
      handleSelectKos(matchedFromCatalog, {
        targetCampusId: matchedFromCatalog.campusId,
      });
      onConsumeFocusTarget?.();
      return;
    }

    const lat =
      typeof focusTarget.lat === 'number'
        ? focusTarget.lat
        : typeof focusTarget.location?.lat === 'number'
          ? focusTarget.location.lat
          : null;
    const lng =
      typeof focusTarget.lng === 'number'
        ? focusTarget.lng
        : typeof focusTarget.location?.lng === 'number'
          ? focusTarget.location.lng
          : null;

    if (lat !== null && lng !== null) {
      const synthesizedKos = {
        id: rawId || `chat-loc-${Date.now()}`,
        campusId: focusTarget.campusId || selectedCampusId,
        name: focusTarget.name || focusTarget.accommodationName || 'Lokasi Rekomendasi AI',
        address: focusTarget.address || '',
        lat,
        lng,
        price: focusTarget.price || 'Lihat Detail Hunian',
        distance: focusTarget.distance || focusTarget.routeSummary?.distanceText || 'Lokasi Terverifikasi',
        type: focusTarget.type || focusTarget.category || 'Hunian / Kos',
        matchScore: focusTarget.matchScore || 95,
        tag: focusTarget.tag || focusTarget.sourceLabel || 'Terverifikasi',
        rating: typeof focusTarget.rating === 'number' ? focusTarget.rating : 4.8,
        reviewsCount: focusTarget.reviewsCount || focusTarget.userRatingCount || 0,
        roomsAvailable: focusTarget.roomsAvailable ?? null,
        visitingHours: focusTarget.visitingHours || null,
        description: focusTarget.description || '',
        contact: focusTarget.contact || null,
        features: Array.isArray(focusTarget.features) ? focusTarget.features : [],
      };
      handleSelectKos(synthesizedKos, {
        targetCampusId: synthesizedKos.campusId,
      });
      onConsumeFocusTarget?.();
    }
  }, [focusTarget, catalogItems, handleSelectKos, onConsumeFocusTarget, selectedCampusId]);

  const handleResetToCampus = () => {
    setSelectedKos(null);
    setIsOverviewOpen(false);
    setActiveRoute(null);
    setZoom(16);
    setFlyToTrigger((n) => n + 1);
  };

  const handleSelectStandaloneFiles = async (files, category) => {
    if (sharedAiAssistant) {
      sharedAiAssistant.onSelectFiles(files, category);
      return;
    }
    const incoming = Array.from(files || []).slice(0, 4);
    for (const file of incoming) {
      const localId = `sk-att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setLocalAttachments((prev) => [
        ...prev,
        {
          localId,
          filename: file.name || 'lampiran',
          kind: category === 'image' || file.type?.startsWith('image/') ? 'image' : 'file',
          status: 'uploading',
        },
      ]);

      try {
        const uploaded = await chatApi.uploadAttachment(file, { category });
        setLocalAttachments((prev) =>
          prev.map((att) =>
            att.localId === localId ? { ...att, ...uploaded, status: 'ready' } : att,
          ),
        );
      } catch {
        setLocalAttachments((prev) =>
          prev.map((att) => (att.localId === localId ? { ...att, status: 'ready' } : att)),
        );
      }
    }
  };

  const handleRemoveStandaloneAttachment = (localId) => {
    if (sharedAiAssistant) {
      sharedAiAssistant.onRemoveAttachment(localId);
      return;
    }
    setLocalAttachments((prev) => prev.filter((att) => att.localId !== localId));
  };

  const handleStopStandaloneStreaming = () => {
    if (sharedAiAssistant) {
      sharedAiAssistant.onStopStreaming();
      return;
    }
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }
    setLocalIsStreaming(false);
  };

  const executeStandaloneSmartKosSearch = useCallback(
    async (promptText, { viaVoice = false, onStepUpdate, onRedirect } = {}) => {
      const trimmed = String(promptText || '').trim();
      if (!trimmed) return null;

      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
      const controller = new AbortController();
      streamAbortRef.current = controller;

      setLocalSidebarOpen(true);
      setLocalIsStreaming(true);
      if (!viaVoice) {
        setLocalChatInput('');
        setLocalAttachments([]);
      }

      const userTurnId = `sk-u-${Date.now()}`;
      const assistantTurnId = `sk-a-${Date.now() + 1}`;

      const initialStatus = {
        orbState: 'reasoning',
        variant: localThinking ? 'twins' : 'default',
        step: 'intent',
        label: 'Menganalisis kriteria lokasi & budget Anda...',
      };
      setLocalOrbStatus(initialStatus);

      setLocalMessages((prev) => [
        ...prev,
        {
          id: userTurnId,
          role: 'user',
          text: trimmed,
          viaVoice,
        },
        {
          id: assistantTurnId,
          role: 'assistant',
          text: '',
          isStreaming: true,
          orbState: initialStatus.orbState,
          orbVariant: initialStatus.variant,
          statusLabel: initialStatus.label,
          matchedKosList: [],
        },
      ]);

      try {
        const donePayload = await smartKosApi.streamSmartKosAiSearch(
          {
            message: trimmed,
            campusId: selectedCampusId,
            reasoningEffort: localThinking ? 'medium' : 'none',
          },
          {
            signal: controller.signal,
            onStatus: (statusData) => {
              setLocalOrbStatus(statusData);
              onStepUpdate?.(statusData);
              setLocalMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantTurnId
                    ? {
                        ...m,
                        orbState: statusData?.orbState || m.orbState,
                        orbVariant: statusData?.variant || m.orbVariant,
                        statusLabel: statusData?.label || m.statusLabel,
                      }
                    : m,
                ),
              );
            },
            onRedirectLocation: (redirectPayload) => {
              if (Array.isArray(redirectPayload?.matchedAccommodations)) {
                setCatalogItems((prev) => {
                  const byId = new Map(prev.map((i) => [i.id, i]));
                  for (const item of redirectPayload.matchedAccommodations) {
                    byId.set(item.id, item);
                  }
                  return Array.from(byId.values());
                });
              }
              if (redirectPayload?.targetKos) {
                lastToolRedirectAtRef.current = Date.now();
                handleSelectKos(redirectPayload.targetKos, {
                  customRoute: redirectPayload.route || null,
                  targetCampusId: redirectPayload.campusId || redirectPayload.targetKos.campusId,
                });
              }
              onRedirect?.(redirectPayload);

              setLocalMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantTurnId
                    ? {
                        ...m,
                        matchedKosList: redirectPayload?.matchedAccommodations || [],
                      }
                    : m,
                ),
              );
            },
            onTextDelta: ({ delta }) => {
              if (!delta) return;
              setLocalMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantTurnId ? { ...m, text: `${m.text}${delta}` } : m,
                ),
              );
            },
            onDone: (finalData) => {
              setLocalMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantTurnId
                    ? {
                        ...m,
                        text: m.text || finalData?.outputText || '',
                        isStreaming: false,
                        orbState: 'idle',
                        orbVariant: 'default',
                        matchedKosList:
                          finalData?.matchedAccommodations || m.matchedKosList || [],
                      }
                    : m,
                ),
              );
            },
          },
        );

        return donePayload;
      } catch (err) {
        if (controller.signal.aborted) return null;

        const lower = trimmed.toLowerCase();
        const localBest =
          visibleAccommodations.find(
            (k) =>
              lower.includes(k.name.toLowerCase()) ||
              (lower.includes('putri') && String(k.type).toLowerCase().includes('putri')) ||
              (lower.includes('putra') && String(k.type).toLowerCase().includes('putra')),
          ) || visibleAccommodations[0];

        if (localBest) {
          handleSelectKos(localBest);
          onRedirect?.({ targetKos: localBest, matchedAccommodations: [localBest] });
        }

        const fallbackText = localBest
          ? `Rekomendasi di sekitar **${selectedCampus.name}**: **${localBest.name}** (${localBest.price}, ${localBest.distance}).`
          : err?.message || 'Maaf, pencarian belum dapat diselesaikan saat ini.';

        setLocalMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTurnId
              ? {
                  ...m,
                  text: fallbackText,
                  isStreaming: false,
                  orbState: 'idle',
                  orbVariant: 'default',
                  matchedKosList: localBest ? [localBest] : [],
                }
              : m,
          ),
        );

        return localBest
          ? {
              outputText: fallbackText,
              targetKos: localBest,
            }
          : null;
      } finally {
        setLocalIsStreaming(false);
      }
    },
    [localThinking, selectedCampusId, handleSelectKos, visibleAccommodations, selectedCampus],
  );

  const handleSendChatMessage = (customPrompt) => {
    const promptToSend = (typeof customPrompt === 'string' ? customPrompt : chatInput).trim();
    if (!promptToSend) return;
    if (sharedAiAssistant) {
      sharedAiAssistant.onSubmitPrompt(promptToSend);
      return;
    }
    executeStandaloneSmartKosSearch(promptToSend, { viaVoice: false });
  };

  const handleOpenVoiceOverlay = () => {
    if (sharedAiAssistant) {
      sharedAiAssistant.onOpenVoice();
      return;
    }
    setLocalSidebarOpen(true);
    setLocalVoiceOpen(true);
  };

  const handleStandaloneVoiceTurn = useCallback(
    ({ role, text }) => {
      const cleaned = String(text || '').trim();
      if (!cleaned) return;
      setLocalSidebarOpen(true);
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `sk-rt-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: role === 'user' ? 'user' : 'assistant',
          text: cleaned,
          viaVoice: true,
          isStreaming: false,
          orbState: 'idle',
          orbVariant: 'default',
        },
      ]);

      // Multi-turn camera sync fallback jika kos disebut lisan pada giliran ke-2+
      if (Date.now() - lastToolRedirectAtRef.current > 1500) {
        const matchedKos = findMentionedKosInText(cleaned, catalogItems);
        if (matchedKos) {
          lastToolRedirectAtRef.current = Date.now();
          handleSelectKos(matchedKos, { targetCampusId: matchedKos.campusId });
        }
      }
    },
    [catalogItems, handleSelectKos],
  );

  const handleStandaloneVoiceRecommendations = useCallback(
    (recPayload) => {
      const recItems = Array.isArray(recPayload?.items) ? recPayload.items : [];
      if (recItems.length === 0) return null;

      const resolvedMatches = recItems
        .map((recItem) => {
          const rawId = String(recItem.rawId || recItem.id || '').replace(/^teralio:/, '');
          const catalogMatch = catalogItems.find(
            (k) =>
              k.id === rawId ||
              k.name.toLowerCase() === String(recItem.name || '').toLowerCase(),
          );
          if (catalogMatch) return catalogMatch;

          if (recItem.location && typeof recItem.location.lat === 'number') {
            return {
              id: rawId || `rt-kos-${Date.now()}`,
              campusId: selectedCampusId,
              name: recItem.name || 'Hunian Kos TERALIO',
              address: recItem.address || selectedCampus.address,
              lat: recItem.location.lat,
              lng: recItem.location.lng,
              price: recItem.price || 'Lihat Tarif',
              distance: recItem.routeSummary?.distanceText || 'Dekat Kampus',
              type: recItem.category || 'Putra / Putri',
              matchScore: 96,
              tag: recItem.sourceLabel || 'Match 96%',
              rating: typeof recItem.rating === 'number' ? recItem.rating : 4.8,
              description: recItem.description || '',
              contact: recItem.contact || null,
              features: Array.isArray(recItem.features) ? recItem.features : [],
            };
          }
          return null;
        })
        .filter(Boolean);

      if (resolvedMatches.length === 0) return null;

      const topTarget = resolvedMatches[0];
      lastToolRedirectAtRef.current = Date.now();
      handleSelectKos(topTarget, {
        targetCampusId: topTarget.campusId || selectedCampusId,
      });

      setLocalMessages((prev) => [
        ...prev,
        {
          id: `sk-rt-match-${Date.now()}`,
          role: 'assistant',
          text: `Peta diarahkan ke **${topTarget.name}** (${topTarget.price}, ${topTarget.distance}).`,
          isStreaming: false,
          orbState: 'idle',
          orbVariant: 'default',
          matchedKosList: resolvedMatches,
        },
      ]);

      return topTarget;
    },
    [catalogItems, selectedCampusId, selectedCampus, handleSelectKos],
  );

  const handleStandaloneVoiceUiAction = useCallback(
    (action) => {
      if (!action) return null;
      if (action.type === 'focus_map' && action.targetKos) {
        lastToolRedirectAtRef.current = Date.now();
        handleSelectKos(action.targetKos, {
          targetCampusId: action.campusId || action.targetKos.campusId,
        });
        return action.targetKos;
      }
      if (action.type === 'open_schedule') {
        if (action.booking) {
          onSurveyBooked?.(action.booking);
        }
        onOpenSchedulePage?.(action);
      }
      return null;
    },
    [handleSelectKos, onSurveyBooked, onOpenSchedulePage],
  );

  return (
    <section
      className={`fullpage-gmaps-root ${
        isSidebarExpanded ? 'sidebar-is-expanded' : 'sidebar-is-minimized'
      } ${isAiSidebarOpen ? 'ai-sidebar-is-open' : ''}`}
      data-testid="subview-discovery"
      aria-label="Smart Kos Interactive Platform Map"
    >
      <h2 className="sr-only">Smart Kos &amp; Listings</h2>

      <div className="fullpage-gmaps-canvas-wrap" data-testid="smart-kos-google-map">
        <InPlatformMapCanvas
          campus={selectedCampus}
          accommodations={visibleAccommodations}
          selectedKos={selectedKos}
          onSelectKos={(kos) => handleSelectKos(kos)}
          mapType={mapType}
          zoom={zoom}
          route={activeRoute}
          showRouteLine={showRouteLine}
          flyToTrigger={flyToTrigger}
        />

        {/* Tombol menu mobile (kampus acuan dipilih otomatis oleh AI dari konteks prompt, default UTB) */}
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

        {/* FLOATING TOP-RIGHT: Layer Toggle (Peta / Satelit), Zoom, & Recenter */}
        <div className="fullmap-hud-topright" role="toolbar" aria-label="Kontrol Peta TERALIO">
          <div className="fullmap-topright-bar">
            <div className="map-campus-toggle" style={{ pointerEvents: 'auto' }}>
              <select
                value={selectedCampusId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedCampusId(nextId);
                  setSelectedKos(null);
                  setActiveRoute(null);
                  if (nextId !== 'all' && campusHubsMap[nextId]) {
                    setZoom(16);
                    setFlyToTrigger((n) => n + 1);
                  }
                }}
                className="map-campus-select"
                aria-label="Pilih Area Kampus"
                data-testid="map-campus-selector"
              >
                <option value="telkom">
                  Telkom Univ ({catalogItems.filter((k) => k.campusId === 'telkom').length || 35} kos)
                </option>
                <option value="all">
                  Semua Kampus ({catalogItems.length || 46} kos)
                </option>
                <option value="utb">
                  UTB Bandung ({catalogItems.filter((k) => k.campusId === 'utb').length || 4} kos)
                </option>
                <option value="itb">
                  ITB Bandung ({catalogItems.filter((k) => k.campusId === 'itb').length || 3} kos)
                </option>
                <option value="ui">
                  UI Depok ({catalogItems.filter((k) => k.campusId === 'ui').length || 2} kos)
                </option>
                <option value="ugm">
                  UGM Yogya ({catalogItems.filter((k) => k.campusId === 'ugm').length || 2} kos)
                </option>
              </select>
            </div>

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
              onClick={() => setZoom((z) => Math.min(19, z + 1))}
              title="Perbesar Peta"
              aria-label="Perbesar Peta"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="map-icon-ctrl-btn"
              onClick={() => setZoom((z) => Math.max(12, z - 1))}
              title="Perkecil Peta"
              aria-label="Perkecil Peta"
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

        {/* SIMPLE GOOGLE-MAPS-STYLE PLACE OVERVIEW CARD */}
        {isOverviewOpen && selectedKos && (
          <KosPlaceOverviewCard
            kos={selectedKos}
            campus={selectedCampus}
            route={activeRoute}
            userName={user?.fullName || 'Mahasiswa Teralio'}
            userId={user?.id || null}
            showRouteLine={showRouteLine}
            onToggleRouteLine={() => setShowRouteLine((prev) => !prev)}
            onFocusOnMap={(kos) => handleSelectKos(kos)}
            onSurveyBooked={onSurveyBooked}
            onOpenSchedule={(booking) =>
              onOpenSchedulePage?.({
                type: 'open_schedule',
                highlightBookingId: booking?.id,
                selectedDate: booking?.scheduledIso,
                booking,
              })
            }
            onClose={() => setIsOverviewOpen(false)}
          />
        )}

        {/* FLOATING BOTTOM CENTER COMPOSER */}
        {!isAiSidebarOpen && (
          <div className="fullmap-hud-bottom" role="region" aria-label="AI Chat Asisten Kos di Peta">
            <div className="fullmap-chat-dock">
              <div className="fullmap-composer-container">
                <ChatComposer
                  value={chatInput}
                  onChange={setChatInput}
                  onSubmit={handleSendChatMessage}
                  onStopStreaming={handleStopStandaloneStreaming}
                  onOpenVoice={handleOpenVoiceOverlay}
                  thinkingEnabled={thinkingEnabled}
                  onToggleThinking={setThinkingEnabled}
                  attachments={chatAttachments}
                  onSelectFiles={handleSelectStandaloneFiles}
                  onRemoveAttachment={handleRemoveStandaloneAttachment}
                  isStreaming={isStreamingAi}
                  placeholder="Cari kos di peta (misal: kos dekat UTB Soekarno-Hatta)..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Standalone Sidebar Fallback (apabila dirender tanpa DashboardPage) */}
        {!sharedAiAssistant && (
          <SmartKosAiSidebar
            isOpen={localSidebarOpen}
            isVoiceOpen={localVoiceOpen}
            onCloseSidebar={() => {
              setLocalVoiceOpen(false);
              setLocalSidebarOpen(false);
            }}
            onOpenVoice={handleOpenVoiceOverlay}
            onCloseVoice={() => setLocalVoiceOpen(false)}
            messages={localMessages}
            isStreaming={localIsStreaming}
            activeStatus={localOrbStatus}
            onSelectKos={(kos) => handleSelectKos(kos)}
            composerValue={localChatInput}
            onComposerChange={setLocalChatInput}
            onSubmitPrompt={() => handleSendChatMessage()}
            onStopStreaming={handleStopStandaloneStreaming}
            thinkingEnabled={localThinking}
            onToggleThinking={setLocalThinking}
            attachments={localAttachments}
            onSelectFiles={handleSelectStandaloneFiles}
            onRemoveAttachment={handleRemoveStandaloneAttachment}
            onExecuteVoiceQuery={(utterance, hooks) =>
              executeStandaloneSmartKosSearch(utterance, { viaVoice: true, ...hooks })
            }
            onVoiceRealtimeTurn={handleStandaloneVoiceTurn}
            onVoiceRealtimeRecommendations={handleStandaloneVoiceRecommendations}
            onVoiceUiAction={handleStandaloneVoiceUiAction}
            activeCampusName={selectedCampus.name}
          />
        )}
      </div>
    </section>
  );
};

export default SmartKosMapView;
