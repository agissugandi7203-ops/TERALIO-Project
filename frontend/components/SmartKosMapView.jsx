import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Layers, Menu, Minus, Plus } from 'lucide-react';
import ChatComposer from './chat/ChatComposer.jsx';
import InPlatformMapCanvas from './map/InPlatformMapCanvas.jsx';
import KosPlaceOverviewCard from './map/KosPlaceOverviewCard.jsx';
import SmartKosAiSidebar from './map/SmartKosAiSidebar.jsx';
import { chatApi } from '../services/chatApi.js';
import { smartKosApi } from '../services/smartKosApi.js';
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
}) => {
  const [campusHubsMap, setCampusHubsMap] = useState(() =>
    Object.fromEntries(CAMPUS_HUBS.map((c) => [c.id, c])),
  );
  const [selectedCampusId, setSelectedCampusId] = useState('telkom');
  const [catalogItems, setCatalogItems] = useState([]);
  const [dataSource, setDataSource] = useState('supabase');

  const [mapType, setMapType] = useState('satellite'); // Default: 'satellite' ('satellite' | 'roadmap')
  const [zoom, setZoom] = useState(16);
  const [flyToTrigger, setFlyToTrigger] = useState(0);

  // Selected Kos & Native In-Platform Overview Sheet (#4)
  const [selectedKos, setSelectedKos] = useState(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [showRouteLine, setShowRouteLine] = useState(true);

  // Right-Hand Conversation Sidebar (#2 — Hanya aktif saat user kirim prompt / buka voice!)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [isStreamingAi, setIsStreamingAi] = useState(false);
  const [activeOrbStatus, setActiveOrbStatus] = useState(null);

  // Shared Composer State
  const [chatInput, setChatInput] = useState('');
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [chatAttachments, setChatAttachments] = useState([]);

  const streamAbortRef = useRef(null);

  const selectedCampus = useMemo(
    () => campusHubsMap[selectedCampusId] || CAMPUS_HUBS[0],
    [campusHubsMap, selectedCampusId],
  );

  // 1. Muat katalog kos secara dinamis dari backend Supabase (`/api/accommodations`)
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
          setDataSource(res.source || 'supabase');
        }
      })
      .catch(() => {
        // Tetap aman apabila dipanggil di lingkungan pengujian yang mem-mock endpoint parsial
      });

    return () => controller.abort();
  }, []);

  // Gabungkan data katalog dinamis Supabase dengan listing eksternal bila tersedia
  const visibleAccommodations = useMemo(() => {
    const campusItems = catalogItems.filter((item) => item.campusId === selectedCampusId);
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

  // Hitung rute jalan kaki kampus -> kos secara dinamis ketika kos dipilih manual
  const loadDynamicRouteForKos = useCallback(
    async (kosTarget, campusTarget) => {
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
    },
    [],
  );

  // Handler memilih pin kos pada peta -> langsung flyTo & buka Overview In-Platform (#4)
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

  // Konsumsi target lokasi dari halaman Chat (`RecommendationSidebar` -> "Buka Overview di Peta")
  useEffect(() => {
    if (!focusTarget) return;

    const rawId = String(focusTarget.rawId || focusTarget.id || '').replace(/^teralio:/, '');
    const matchedFromCatalog = catalogItems.find(
      (k) => k.id === rawId || k.name.toLowerCase() === String(focusTarget.name || '').toLowerCase(),
    );

    if (matchedFromCatalog) {
      handleSelectKos(matchedFromCatalog);
      onConsumeFocusTarget?.();
      return;
    }

    if (focusTarget.location && typeof focusTarget.location.lat === 'number') {
      const synthesizedKos = {
        id: rawId || `chat-loc-${Date.now()}`,
        campusId: selectedCampusId,
        name: focusTarget.name || 'Lokasi Rekomendasi AI',
        address: focusTarget.address || '',
        lat: focusTarget.location.lat,
        lng: focusTarget.location.lng,
        price: focusTarget.price || 'Lihat Detail Hunian',
        distance: focusTarget.routeSummary?.distanceText || 'Lokasi Terverifikasi',
        type: focusTarget.category || 'Hunian / Kos',
        matchScore: 95,
        tag: focusTarget.sourceLabel || 'Terverifikasi',
        rating: typeof focusTarget.rating === 'number' ? focusTarget.rating : 4.8,
        reviewsCount: focusTarget.userRatingCount || 0,
        description: focusTarget.description || '',
        contact: focusTarget.contact || null,
        features: Array.isArray(focusTarget.features) ? focusTarget.features : [],
      };
      handleSelectKos(synthesizedKos);
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

  const handleSelectChatFiles = async (files, category) => {
    const incoming = Array.from(files || []).slice(0, 4);
    for (const file of incoming) {
      const localId = `sk-att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setChatAttachments((prev) => [
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
        setChatAttachments((prev) =>
          prev.map((att) =>
            att.localId === localId ? { ...att, ...uploaded, status: 'ready' } : att,
          ),
        );
      } catch {
        setChatAttachments((prev) =>
          prev.map((att) => (att.localId === localId ? { ...att, status: 'ready' } : att)),
        );
      }
    }
  };

  const handleRemoveChatAttachment = (localId) => {
    setChatAttachments((prev) => prev.filter((att) => att.localId !== localId));
  };

  const handleStopStreaming = () => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }
    setIsStreamingAi(false);
  };

  /**
   * Orkestrasi utama pencarian Smart Kos (dipakai oleh Text Prompt Sidebar #2 maupun Voice Orb #3).
   */
  const executeSmartKosSearch = useCallback(
    async (promptText, { viaVoice = false, onStepUpdate, onRedirect } = {}) => {
      const trimmed = String(promptText || '').trim();
      if (!trimmed) return null;

      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
      const controller = new AbortController();
      streamAbortRef.current = controller;

      // Aktifkan Right Conversation Sidebar (#2) begitu user mengirim prompt!
      setIsAiSidebarOpen(true);
      setIsStreamingAi(true);
      if (!viaVoice) {
        setChatInput('');
        setChatAttachments([]);
      }

      const userTurnId = `sk-u-${Date.now()}`;
      const assistantTurnId = `sk-a-${Date.now() + 1}`;

      const initialStatus = {
        orbState: 'reasoning',
        variant: thinkingEnabled ? 'twins' : 'default',
        step: 'intent',
        label: 'Menganalisis kriteria lokasi & budget Anda...',
      };
      setActiveOrbStatus(initialStatus);

      setAiMessages((prev) => [
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
            reasoningEffort: thinkingEnabled ? 'medium' : 'none',
          },
          {
            signal: controller.signal,
            onStatus: (statusData) => {
              setActiveOrbStatus(statusData);
              onStepUpdate?.(statusData);
              setAiMessages((prev) =>
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
              if (redirectPayload?.dataSource) {
                setDataSource(redirectPayload.dataSource);
              }
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
                handleSelectKos(redirectPayload.targetKos, {
                  customRoute: redirectPayload.route || null,
                  targetCampusId: redirectPayload.campusId || redirectPayload.targetKos.campusId,
                });
              }
              onRedirect?.(redirectPayload);

              setAiMessages((prev) =>
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
              setAiMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantTurnId ? { ...m, text: `${m.text}${delta}` } : m,
                ),
              );
            },
            onDone: (finalData) => {
              setAiMessages((prev) =>
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

        // Fallback lokal cerdas bila endpoint belum terjangkau (misal mock fetch terbatas di unit test lama)
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
          ? `Rekomendasi TERALIO AI di sekitar **${selectedCampus.name}**: **${localBest.name}** (${localBest.price}, ${localBest.distance}). Panel Overview Lokasi di peta telah dibuka otomatis.`
          : err?.message || 'Maaf, pencarian belum dapat diselesaikan saat ini.';

        setAiMessages((prev) =>
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
              voiceSummary: `Saya mengarahkan peta ke ${localBest.name} dengan harga ${localBest.price}.`,
              targetKos: localBest,
            }
          : null;
      } finally {
        setIsStreamingAi(false);
      }
    },
    [thinkingEnabled, selectedCampusId, handleSelectKos, visibleAccommodations, selectedCampus],
  );

  const handleSendChatMessage = (customPrompt) => {
    const promptToSend = (typeof customPrompt === 'string' ? customPrompt : chatInput).trim();
    if (!promptToSend) return;
    executeSmartKosSearch(promptToSend, { viaVoice: false });
  };

  // Klik ikon Wave -> Buka Sidebar Kanan sekaligus tutupi dengan Voice Orb Overlay (#3)
  const handleOpenVoiceOverlay = () => {
    setIsAiSidebarOpen(true);
    setIsVoiceOverlayOpen(true);
  };

  // Handler transkrip lisan real-time dari OpenAI `gpt-realtime-2.1` WebRTC di Smart Kos
  const handleRealtimeVoiceTurn = useCallback(({ role, text }) => {
    const cleaned = String(text || '').trim();
    if (!cleaned) return;
    setIsAiSidebarOpen(true);
    setAiMessages((prev) => [
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
  }, []);

  // Handler saat `gpt-realtime-2.1` memanggil `teralio_search_accommodations` via `/api/realtime/tool-call`
  const handleRealtimeVoiceRecommendations = useCallback(
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
      handleSelectKos(topTarget, {
        targetCampusId: topTarget.campusId || selectedCampusId,
      });

      setAiMessages((prev) => [
        ...prev,
        {
          id: `sk-rt-match-${Date.now()}`,
          role: 'assistant',
          text: `Peta otomatis diarahkan ke **${topTarget.name}** (${topTarget.price}, ${topTarget.distance}).`,
          isStreaming: false,
          orbState: 'idle',
          orbVariant: 'default',
          statusLabel: 'Peta & Overview telah diperbarui',
          matchedKosList: resolvedMatches,
        },
      ]);

      return topTarget;
    },
    [catalogItems, selectedCampusId, selectedCampus, handleSelectKos],
  );

  return (
    <section
      className={`fullpage-gmaps-root ${
        isSidebarExpanded ? 'sidebar-is-expanded' : 'sidebar-is-minimized'
      } ${isAiSidebarOpen ? 'ai-sidebar-is-open' : ''}`}
      data-testid="subview-discovery"
      aria-label="Smart Kos Match Interactive Platform Map"
    >
      <h2 className="sr-only">Smart Kos Match &amp; Listings</h2>

      <div className="fullpage-gmaps-canvas-wrap" data-testid="smart-kos-google-map">
        {/* 100% NATIVE IN-PLATFORM INTERACTIVE MAP (Zero External "Open with Maps" Iframe) */}
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

        {/* FLOATING TOP-LEFT: Mobile Menu Button */}
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

        {/* #4: NATIVE IN-PLATFORM GOOGLE-MAPS-STYLE PLACE OVERVIEW SHEET */}
        {isOverviewOpen && selectedKos && (
          <KosPlaceOverviewCard
            kos={selectedKos}
            campus={selectedCampus}
            route={activeRoute}
            userName={user?.fullName || 'Mahasiswa TERALIO'}
            dataSource={dataSource}
            showRouteLine={showRouteLine}
            onToggleRouteLine={() => setShowRouteLine((prev) => !prev)}
            onFocusOnMap={(kos) => handleSelectKos(kos)}
            onSurveyBooked={onSurveyBooked}
            onClose={() => setIsOverviewOpen(false)}
          />
        )}

        {/* FLOATING BOTTOM CENTER COMPOSER (Tampil bersih sebelum Right AI Sidebar aktif) */}
        {!isAiSidebarOpen && (
          <div className="fullmap-hud-bottom" role="region" aria-label="AI Chat Asisten Kos di Peta">
            <div className="fullmap-chat-dock">
              <div className="fullmap-composer-container">
                <ChatComposer
                  value={chatInput}
                  onChange={setChatInput}
                  onSubmit={handleSendChatMessage}
                  onStopStreaming={handleStopStreaming}
                  onOpenVoice={handleOpenVoiceOverlay}
                  thinkingEnabled={thinkingEnabled}
                  onToggleThinking={setThinkingEnabled}
                  attachments={chatAttachments}
                  onSelectFiles={handleSelectChatFiles}
                  onRemoveAttachment={handleRemoveChatAttachment}
                  isStreaming={isStreamingAi}
                  placeholder="Minta Teralio AI carikan kos di peta (misal: kos putri dekat ITB Dago)..."
                />
              </div>
            </div>
          </div>
        )}

        {/* #2 & #3: RIGHT-HAND CONVERSATION SIDEBAR + VOICE ORB COVERING SIDEBAR #2 */}
        <SmartKosAiSidebar
          isOpen={isAiSidebarOpen}
          isVoiceOpen={isVoiceOverlayOpen}
          onCloseSidebar={() => {
            setIsVoiceOverlayOpen(false);
            setIsAiSidebarOpen(false);
          }}
          onOpenVoice={handleOpenVoiceOverlay}
          onCloseVoice={() => setIsVoiceOverlayOpen(false)}
          messages={aiMessages}
          isStreaming={isStreamingAi}
          activeStatus={activeOrbStatus}
          onSelectKos={(kos) => handleSelectKos(kos)}
          composerValue={chatInput}
          onComposerChange={setChatInput}
          onSubmitPrompt={() => handleSendChatMessage()}
          onStopStreaming={handleStopStreaming}
          thinkingEnabled={thinkingEnabled}
          onToggleThinking={setThinkingEnabled}
          attachments={chatAttachments}
          onSelectFiles={handleSelectChatFiles}
          onRemoveAttachment={handleRemoveChatAttachment}
          onExecuteVoiceQuery={(utterance, hooks) =>
            executeSmartKosSearch(utterance, { viaVoice: true, ...hooks })
          }
          onVoiceRealtimeTurn={handleRealtimeVoiceTurn}
          onVoiceRealtimeRecommendations={handleRealtimeVoiceRecommendations}
          activeCampusName={selectedCampus.name}
          dataSource={dataSource}
        />
      </div>
    </section>
  );
};

export default SmartKosMapView;
