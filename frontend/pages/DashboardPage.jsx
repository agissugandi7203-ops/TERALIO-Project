import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import DashboardTopbar from '../components/DashboardTopbar.jsx';
import HeroBannerCard from '../components/HeroBannerCard.jsx';
import MatchStatusCard from '../components/MatchStatusCard.jsx';
import CuratedKosCard from '../components/CuratedKosCard.jsx';
import BudgetMeterCard from '../components/BudgetMeterCard.jsx';
import ProximityWaveCard from '../components/ProximityWaveCard.jsx';
import SmartKosMapView from '../components/SmartKosMapView.jsx';
import ChatWorkspace from '../components/chat/ChatWorkspace.jsx';
import VisitScheduleView from '../components/schedule/VisitScheduleView.jsx';
import NotificationsView from '../components/notifications/NotificationsView.jsx';
import SmartKosAiSidebar from '../components/map/SmartKosAiSidebar.jsx';
import { smartKosApi } from '../services/smartKosApi.js';
import { chatApi } from '../services/chatApi.js';
import { findMentionedKosInText } from '../utils/kosVoiceMatcher.js';
import { fireConfetti } from '../utils/confetti.js';
import { CURATED_ACCOMMODATIONS } from '../constants/curatedAccommodations.js';
import '../styles/dashboard.css';
import '../styles/smart-kos.css';

const DEFAULT_RECOMMENDED_KOS = CURATED_ACCOMMODATIONS;

const PAGE_LABELS = {
  home: 'Home Overview',
  discovery: 'Smart Kos Match',
  schedule: 'Visit Schedule',
  notifications: 'Notifications',
  settings: 'Preferences',
  system: 'System Status',
};

// Prompt yang berkaitan dengan janji temu / kalender diarahkan ke OpenAI Responses + MCP schedule tools
const SCHEDULE_INTENT_RE =
  /\b(jadwal\w*|janji\s*temu|survei|survey|booking|book|kunjung\w*|ganti\s*jam|ubah\s*jam|undur|reschedule|batal\w*|visit|kalender|calendar|jam\s*berapa|tanggal\s*berapa|hari\s*apa)\b/i;

// Permintaan eksplisit dari pengguna untuk membuka / melihat tampilan peta
const EXPLICIT_MAP_INTENT_RE =
  /\b(buka\s*(peta|maps?)|tampil\w*\s*(di\s*)?(peta|maps?)|lihat\s*(di\s*)?(peta|maps?)|tunjuk\w*\s*(di\s*)?(peta|maps?)|ke\s*(halaman\s*)?(peta|maps?)|arah\w*\s*(ke\s*)?(peta|maps?))\b/i;

function pickLocalBestKos(promptText, catalog = []) {
  if (!Array.isArray(catalog) || catalog.length === 0) return null;
  const lower = String(promptText || '').toLowerCase();
  const byName = findMentionedKosInText(promptText, catalog);
  if (byName) return byName;
  const campusHint = ['utb', 'telkom', 'itb', 'ui', 'ugm'].find((c) =>
    new RegExp(`\\b${c}\\b`, 'i').test(lower),
  );
  const pool = campusHint ? catalog.filter((k) => k.campusId === campusHint) : catalog;
  const candidates = pool.length > 0 ? pool : catalog;
  return (
    candidates.find(
      (k) =>
        (lower.includes('putri') && String(k.type).toLowerCase().includes('putri')) ||
        (lower.includes('putra') && String(k.type).toLowerCase().includes('putra')),
    ) || candidates[0]
  );
}

export const DashboardPage = ({
  user = null,
  onLogout,
  onNavigate,
}) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    try {
      return localStorage.getItem('teralio_sidebar_expanded') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingChatPrompt, setPendingChatPrompt] = useState('');
  const [openVoiceSignal, setOpenVoiceSignal] = useState(0);
  const [smartKosFocusTarget, setSmartKosFocusTarget] = useState(null);
  const [surveyBookings, setSurveyBookings] = useState([]);
  const [backendItems, setBackendItems] = useState([]);
  const [backendHealth, setBackendHealth] = useState(null);
  const [accommodationsCatalog, setAccommodationsCatalog] = useState([]);
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);

  // Shared cross-page AI & Voice sidebar state (persisten lintas halaman)
  const [isGlobalAiOpen, setIsGlobalAiOpen] = useState(false);
  const [isGlobalVoiceOpen, setIsGlobalVoiceOpen] = useState(false);
  const [globalAiMessages, setGlobalAiMessages] = useState([]);
  const [globalIsStreaming, setGlobalIsStreaming] = useState(false);
  const [globalOrbStatus, setGlobalOrbStatus] = useState(null);
  const [globalComposerText, setGlobalComposerText] = useState('');
  const [globalThinkingEnabled, setGlobalThinkingEnabled] = useState(false);
  const [globalAttachments, setGlobalAttachments] = useState([]);
  const [activeCampusInfo, setActiveCampusInfo] = useState(null);

  const globalAbortRef = useRef(null);
  const previousResponseIdRef = useRef(null);
  const lastToolRedirectAtRef = useRef(0);
  const catalogRef = useRef([]);
  catalogRef.current = accommodationsCatalog;
  const activeNavRef = useRef(activeNav);
  activeNavRef.current = activeNav;

  // Sync expanded state to localStorage
  const handleToggleSidebar = () => {
    setIsSidebarExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('teralio_sidebar_expanded', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Enforce Light Theme for Dashboard view (default color wajib terang)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('teralio-dashboard-body');
      document.documentElement.classList.add('teralio-dashboard-html');
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('teralio-dashboard-body');
        document.documentElement.classList.remove('teralio-dashboard-html');
      }
    };
  }, []);

  // Fetch backend accommodation items, health, bookings & catalog on mount
  useEffect(() => {
    let isMounted = true;

    fetch('/api/items')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (isMounted && Array.isArray(payload?.data)) {
          setBackendItems(payload.data);
        }
      })
      .catch(() => {});

    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (isMounted && payload) {
          setBackendHealth(payload);
        }
      })
      .catch(() => {});

    smartKosApi
      .fetchSurveyBookings()
      .then((bookings) => {
        if (isMounted && Array.isArray(bookings)) {
          setSurveyBookings(bookings);
        }
      })
      .catch(() => {});

    smartKosApi
      .fetchAccommodations()
      .then((res) => {
        if (isMounted && Array.isArray(res?.items) && res.items.length > 0) {
          setAccommodationsCatalog(res.items);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (globalAbortRef.current) {
        globalAbortRef.current.abort();
      }
    },
    [],
  );

  const profileUser = {
    fullName:
      user?.fullName ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.name ||
      (user?.email ? user.email.split('@')[0] : 'Explorer'),
    role: user?.email ? `${user.email} • Student` : user?.role || 'Student Member',
    avatarUrl:
      user?.avatarUrl ||
      user?.user_metadata?.avatar_url ||
      user?.picture ||
      user?.user_metadata?.picture ||
      '',
  };

  const handleOpenChat = (customPrompt = '') => {
    if (customPrompt) {
      setPendingChatPrompt(customPrompt);
    }
    setActiveNav('chat');
  };

  const handleOpenVoiceChat = () => {
    setActiveNav('chat');
    setOpenVoiceSignal((prev) => prev + 1);
  };

  const handleUpgrade = () => {
    // Tetap di sini tanpa redirect, luncurkan selebrasi confetti
    fireConfetti({ particleCount: 110, originX: 0.88, originY: 0.08 });
  };

  const handleCatalogLoaded = useCallback((items) => {
    if (Array.isArray(items) && items.length > 0) {
      setAccommodationsCatalog((prev) => {
        const byId = new Map(prev.map((i) => [i.id, i]));
        for (const item of items) byId.set(item.id, item);
        return Array.from(byId.values());
      });
    }
  }, []);

  const handleCampusChanged = useCallback((campus) => {
    setActiveCampusInfo(campus || null);
  }, []);

  const upsertBooking = useCallback((booking) => {
    if (!booking?.id) return;
    setSurveyBookings((prev) => [booking, ...prev.filter((b) => b.id !== booking.id)]);
  }, []);

  const focusKosOnMap = useCallback((kosTarget, { switchToMap = false } = {}) => {
    if (!kosTarget) return;
    lastToolRedirectAtRef.current = Date.now();
    setSmartKosFocusTarget({ ...kosTarget, _focusNonce: Date.now() });
    if (switchToMap || activeNavRef.current === 'discovery') {
      setActiveNav('discovery');
    }
  }, []);

  // Router aksi UI dari tool AI (Realtime Voice, Responses SSE, MCP)
  const handleGlobalUiAction = useCallback(
    (action) => {
      if (!action || typeof action !== 'object') return null;

      if (action.type === 'open_schedule') {
        if (action.booking) {
          upsertBooking(action.booking);
        }
        setHighlightedBookingId(action.highlightBookingId || action.booking?.id || null);
        setSelectedScheduleDate(action.selectedDate || action.booking?.scheduledIso || null);
        setActiveNav('schedule');

        smartKosApi
          .fetchSurveyBookings()
          .then((bookings) => {
            if (!Array.isArray(bookings)) return;
            setSurveyBookings((prev) => {
              const byId = new Map(bookings.map((b) => [b.id, b]));
              for (const b of prev) {
                if (!byId.has(b.id)) byId.set(b.id, b);
              }
              if (action.booking?.id) byId.set(action.booking.id, action.booking);
              return Array.from(byId.values());
            });
          })
          .catch(() => {});
        return null;
      }

      if (action.type === 'focus_map' && action.targetKos) {
        // Hanya ganti halaman ke peta jika ada perintah eksplisit atau pengguna memang sedang di peta
        const shouldSwitch = Boolean(action.explicitNav || activeNavRef.current === 'discovery');
        focusKosOnMap(action.targetKos, { switchToMap: shouldSwitch });
        return action.targetKos;
      }

      return null;
    },
    [upsertBooking, focusKosOnMap],
  );

  // Dari halaman Chat: hanya redirect otomatis untuk Visit Schedule (fokus peta via tombol rekomendasi)
  const handleChatWorkspaceUiAction = useCallback(
    (action) => {
      if (action?.type === 'open_schedule') {
        handleGlobalUiAction(action);
      }
    },
    [handleGlobalUiAction],
  );

  const patchGlobalMessage = useCallback((messageId, updater) => {
    setGlobalAiMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updater(m) } : m)),
    );
  }, []);

  const executeCrossPagePrompt = useCallback(
    async (promptText, { viaVoice = false, onStepUpdate, onRedirect } = {}) => {
      const trimmed = String(promptText || '').trim();
      if (!trimmed) return null;

      if (globalAbortRef.current) {
        globalAbortRef.current.abort();
      }
      const controller = new AbortController();
      globalAbortRef.current = controller;

      const readyAttachments = viaVoice
        ? []
        : globalAttachments.filter((att) => att.status === 'ready' && att.uploaded);

      setIsGlobalAiOpen(true);
      setGlobalIsStreaming(true);
      if (!viaVoice) {
        setGlobalComposerText('');
        setGlobalAttachments([]);
      }

      const now = Date.now();
      const userTurnId = `gx-u-${now}`;
      const assistantTurnId = `gx-a-${now + 1}`;
      const initialStatus = {
        orbState: 'reasoning',
        variant: globalThinkingEnabled ? 'twins' : 'default',
        step: 'intent',
        label: 'Menganalisis permintaan Anda...',
      };
      setGlobalOrbStatus(initialStatus);
      setGlobalAiMessages((prev) => [
        ...prev,
        { id: userTurnId, role: 'user', text: trimmed, viaVoice },
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

      const applyStatus = (statusData) => {
        if (!statusData) return;
        setGlobalOrbStatus(statusData);
        onStepUpdate?.(statusData);
        patchGlobalMessage(assistantTurnId, (m) => ({
          orbState: statusData.orbState || m.orbState,
          orbVariant: statusData.variant || m.orbVariant,
          statusLabel: statusData.label || m.statusLabel,
        }));
      };

      const finishMessage = (extra = {}) => {
        patchGlobalMessage(assistantTurnId, (m) => ({
          isStreaming: false,
          orbState: 'idle',
          orbVariant: 'default',
          statusLabel: null,
          ...extra,
          text: extra.text !== undefined ? extra.text : m.text,
        }));
      };

      const useScheduleAgent =
        activeNavRef.current === 'schedule' ||
        readyAttachments.length > 0 ||
        SCHEDULE_INTENT_RE.test(trimmed);

      try {
        if (useScheduleAgent) {
          // OpenAI Responses + MCP tools (datetime, list/create/update visit schedule, focus map)
          let bookedVisit = null;
          const donePayload = await chatApi.streamChatResponse(
            {
              message: trimmed,
              ...(readyAttachments.length > 0
                ? { attachments: readyAttachments.map((att) => att.uploaded) }
                : {}),
              ...(previousResponseIdRef.current
                ? { previousResponseId: previousResponseIdRef.current }
                : {}),
              reasoningEffort: globalThinkingEnabled ? 'high' : 'low',
              userContext: {
                userName: profileUser.fullName,
                city: 'Bandung',
                activeView: PAGE_LABELS[activeNavRef.current] || 'Dashboard',
                activeCampus: activeCampusInfo?.name || 'Universitas Teknologi Bandung (UTB)',
              },
              userLocation: { country: 'ID', city: 'Bandung' },
            },
            {
              signal: controller.signal,
              onStatus: applyStatus,
              onToolStart: (toolData) =>
                applyStatus({
                  orbState: toolData?.orbState || 'working',
                  variant: toolData?.variant || 'gyro',
                  step: 'database',
                  label: toolData?.label || 'Menjalankan tool TERALIO...',
                }),
              onUiAction: (action) => {
                if (action?.type === 'open_schedule' && action.booking) {
                  bookedVisit = action.booking;
                }
                if (action?.type === 'focus_map' && action.targetKos) {
                  onRedirect?.({ targetKos: action.targetKos });
                }
                handleGlobalUiAction(action);
              },
              onTextDelta: ({ delta }) => {
                if (!delta) return;
                patchGlobalMessage(assistantTurnId, (m) => ({ text: `${m.text}${delta}` }));
              },
            },
          );

          if (donePayload?.responseId) {
            previousResponseIdRef.current = donePayload.responseId;
          }
          finishMessage({
            text: undefined,
            ...(bookedVisit ? { bookedVisit } : {}),
          });
          patchGlobalMessage(assistantTurnId, (m) => ({
            text: m.text || donePayload?.outputText || '',
          }));
          return donePayload;
        }

        // Pencarian kos berbasis database (Supabase) + redirect kamera peta
        const donePayload = await smartKosApi.streamSmartKosAiSearch(
          {
            message: trimmed,
            campusId: activeCampusInfo?.id || undefined,
            reasoningEffort: globalThinkingEnabled ? 'medium' : 'none',
          },
          {
            signal: controller.signal,
            onStatus: applyStatus,
            onRedirectLocation: (redirectPayload) => {
              if (Array.isArray(redirectPayload?.matchedAccommodations)) {
                handleCatalogLoaded(redirectPayload.matchedAccommodations);
              }
              if (redirectPayload?.targetKos) {
                const shouldSwitch = Boolean(
                  EXPLICIT_MAP_INTENT_RE.test(trimmed) || activeNavRef.current === 'discovery'
                );
                focusKosOnMap(redirectPayload.targetKos, { switchToMap: shouldSwitch });
              }
              onRedirect?.(redirectPayload);
              patchGlobalMessage(assistantTurnId, () => ({
                matchedKosList: redirectPayload?.matchedAccommodations || [],
              }));
            },
            onTextDelta: ({ delta }) => {
              if (!delta) return;
              patchGlobalMessage(assistantTurnId, (m) => ({ text: `${m.text}${delta}` }));
            },
            onDone: (finalData) => {
              patchGlobalMessage(assistantTurnId, (m) => ({
                text: m.text || finalData?.outputText || '',
                matchedKosList: finalData?.matchedAccommodations || m.matchedKosList || [],
              }));
            },
          },
        );
        finishMessage({ text: undefined });
        return donePayload;
      } catch (err) {
        if (controller.signal.aborted) return null;

        if (useScheduleAgent) {
          finishMessage({
            text: err?.message || 'Maaf, permintaan jadwal belum dapat diproses saat ini.',
          });
          return null;
        }

        const localBest = pickLocalBestKos(trimmed, catalogRef.current);
        if (localBest) {
          const shouldSwitch = Boolean(
            EXPLICIT_MAP_INTENT_RE.test(trimmed) || activeNavRef.current === 'discovery'
          );
          focusKosOnMap(localBest, { switchToMap: shouldSwitch });
          onRedirect?.({ targetKos: localBest, matchedAccommodations: [localBest] });
        }
        const fallbackText = localBest
          ? `Rekomendasi terdekat dari database TERALIO: **${localBest.name}** (${localBest.price}, ${localBest.distance}).`
          : err?.message || 'Maaf, pencarian belum dapat diselesaikan saat ini.';
        finishMessage({ text: fallbackText, matchedKosList: localBest ? [localBest] : [] });
        return localBest ? { outputText: fallbackText, targetKos: localBest } : null;
      } finally {
        if (globalAbortRef.current === controller) {
          globalAbortRef.current = null;
        }
        setGlobalIsStreaming(false);
      }
    },
    [
      globalAttachments,
      globalThinkingEnabled,
      activeCampusInfo,
      profileUser.fullName,
      patchGlobalMessage,
      handleGlobalUiAction,
      handleCatalogLoaded,
      focusKosOnMap,
    ],
  );

  const handleGlobalSelectFiles = useCallback(async (files, category) => {
    const incoming = Array.from(files || []).slice(0, 4);
    for (const file of incoming) {
      const localId = `gx-att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setGlobalAttachments((prev) => [
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
        setGlobalAttachments((prev) =>
          prev.map((att) =>
            att.localId === localId ? { ...att, uploaded, status: 'ready' } : att,
          ),
        );
      } catch (err) {
        setGlobalAttachments((prev) =>
          prev.map((att) =>
            att.localId === localId
              ? { ...att, status: 'error', error: err?.message || 'Upload gagal' }
              : att,
          ),
        );
      }
    }
  }, []);

  const handleGlobalStopStreaming = useCallback(() => {
    if (globalAbortRef.current) {
      globalAbortRef.current.abort();
      globalAbortRef.current = null;
    }
    setGlobalIsStreaming(false);
    setGlobalAiMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false, orbState: 'idle' } : m)),
    );
  }, []);

  const openGlobalVoice = useCallback(() => {
    setIsGlobalAiOpen(true);
    setIsGlobalVoiceOpen(true);
  }, []);

  // Realtime Voice: transkrip -> pesan sidebar + fallback kamera multi-turn
  const handleGlobalVoiceTurn = useCallback(
    ({ role, text }) => {
      const cleaned = String(text || '').trim();
      if (!cleaned) return;
      setGlobalAiMessages((prev) => [
        ...prev,
        {
          id: `gx-rt-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: role === 'user' ? 'user' : 'assistant',
          text: cleaned,
          viaVoice: true,
          isStreaming: false,
          orbState: 'idle',
          orbVariant: 'default',
        },
      ]);

      if (activeNavRef.current === 'discovery' && Date.now() - lastToolRedirectAtRef.current > 1500) {
        const matchedKos = findMentionedKosInText(cleaned, catalogRef.current);
        if (matchedKos) {
          focusKosOnMap(matchedKos);
        }
      }
    },
    [focusKosOnMap],
  );

  const handleGlobalVoiceRecommendations = useCallback(
    (recPayload) => {
      const recItems = Array.isArray(recPayload?.items) ? recPayload.items : [];
      if (recItems.length === 0) return null;

      const resolved = recItems
        .map((recItem) => {
          const rawId = String(recItem.rawId || recItem.id || '').replace(/^teralio:/, '');
          const fromCatalog = catalogRef.current.find(
            (k) =>
              k.id === rawId ||
              k.name.toLowerCase() === String(recItem.name || '').toLowerCase(),
          );
          if (fromCatalog) return fromCatalog;
          if (recItem.location && typeof recItem.location.lat === 'number') {
            return {
              id: rawId || `rt-kos-${Date.now()}`,
              name: recItem.name || 'Hunian Kos TERALIO',
              address: recItem.address || '',
              lat: recItem.location.lat,
              lng: recItem.location.lng,
              price: recItem.price || 'Lihat Tarif',
              distance: recItem.routeSummary?.distanceText || 'Dekat Kampus',
              type: recItem.category || 'Putra / Putri',
              rating: typeof recItem.rating === 'number' ? recItem.rating : 4.8,
              description: recItem.description || '',
              contact: recItem.contact || null,
              features: Array.isArray(recItem.features) ? recItem.features : [],
            };
          }
          return null;
        })
        .filter(Boolean);

      if (resolved.length === 0) return null;
      const top = resolved[0];
      focusKosOnMap(top, { switchToMap: activeNavRef.current === 'discovery' });
      setGlobalAiMessages((prev) => [
        ...prev,
        {
          id: `gx-rt-match-${Date.now()}`,
          role: 'assistant',
          text: `Rekomendasi hunian: **${top.name}** (${top.price}, ${top.distance}). Anda dapat mengklik kartu kos di bawah atau meminta "buka peta" untuk melihat lokasinya di peta.`,
          isStreaming: false,
          orbState: 'idle',
          orbVariant: 'default',
          matchedKosList: resolved,
        },
      ]);
      return top;
    },
    [focusKosOnMap],
  );

  const handleGlobalVoiceUiAction = useCallback(
    (action) => {
      const result = handleGlobalUiAction(action);
      if (action?.type === 'open_schedule' && action.booking) {
        setGlobalAiMessages((prev) => [
          ...prev,
          {
            id: `gx-rt-book-${Date.now()}`,
            role: 'assistant',
            text: '',
            isStreaming: false,
            orbState: 'idle',
            orbVariant: 'default',
            bookedVisit: action.booking,
          },
        ]);
      }
      return result;
    },
    [handleGlobalUiAction],
  );

  const handleOpenScheduleFromAnywhere = useCallback(
    (actionOrBooking) => {
      if (!actionOrBooking) {
        setActiveNav('schedule');
        return;
      }
      if (actionOrBooking.type === 'open_schedule') {
        handleGlobalUiAction(actionOrBooking);
        return;
      }
      handleGlobalUiAction({
        type: 'open_schedule',
        booking: actionOrBooking,
        highlightBookingId: actionOrBooking.id,
        selectedDate: actionOrBooking.scheduledIso,
      });
    },
    [handleGlobalUiAction],
  );

  const handleViewBookingOnMap = useCallback(
    (booking) => {
      if (!booking) return;
      const fromCatalog = catalogRef.current.find(
        (k) =>
          k.id === booking.accommodationId ||
          k.name.toLowerCase() === String(booking.accommodationName || '').toLowerCase(),
      );
      focusKosOnMap(
        fromCatalog || {
          id: booking.accommodationId,
          name: booking.accommodationName,
          address: booking.address,
        },
        { switchToMap: true },
      );
    },
    [focusKosOnMap],
  );

  const handleCuratedKosMapClick = useCallback(
    (spotlight) => {
      if (!spotlight) return;
      const q = String(spotlight.query || spotlight.title || '').toLowerCase();
      const matched =
        catalogRef.current.find(
          (k) =>
            k.name.toLowerCase().includes(q) ||
            q.includes(k.name.toLowerCase()) ||
            k.campusId === spotlight.campusId,
        ) || {
          id: `curated-${Date.now()}`,
          name: spotlight.title,
          campusId: spotlight.campusId || 'telkom',
          description: spotlight.copy,
        };
      focusKosOnMap(matched, { switchToMap: true });
    },
    [focusKosOnMap],
  );

  const sharedAiAssistant = {
    isOpen: isGlobalAiOpen,
    composerValue: globalComposerText,
    setComposerValue: setGlobalComposerText,
    thinkingEnabled: globalThinkingEnabled,
    setThinkingEnabled: setGlobalThinkingEnabled,
    attachments: globalAttachments,
    isStreaming: globalIsStreaming,
    onSelectFiles: handleGlobalSelectFiles,
    onRemoveAttachment: (localId) =>
      setGlobalAttachments((prev) => prev.filter((att) => att.localId !== localId)),
    onStopStreaming: handleGlobalStopStreaming,
    onSubmitPrompt: (promptText) => executeCrossPagePrompt(promptText, { viaVoice: false }),
    onOpenVoice: openGlobalVoice,
  };

  // Filter listings based on search bar
  const query = searchQuery.trim().toLowerCase();
  const allListings =
    accommodationsCatalog.length > 0
      ? accommodationsCatalog
      : DEFAULT_RECOMMENDED_KOS;
  const filteredListings = query
    ? allListings.filter(
        (item) =>
          (item.name || item.title || '').toLowerCase().includes(query) ||
          (item.area || '').toLowerCase().includes(query) ||
          (item.city || '').toLowerCase().includes(query) ||
          (item.type || '').toLowerCase().includes(query) ||
          (item.distance || item.category || '').toLowerCase().includes(query) ||
          (item.features || []).some((f) => f.toLowerCase().includes(query))
      )
    : allListings;

  const isFullPageMaps = activeNav === 'discovery';
  const isChatMode = activeNav === 'chat';
  const isScheduleMode = activeNav === 'schedule';
  const showCrossPageSidebar = !isChatMode;
  const isCrossPageSidebarVisible =
    showCrossPageSidebar && !isFullPageMaps && (isGlobalAiOpen || isGlobalVoiceOpen);
  const showCrossPageFab =
    !isChatMode && !isFullPageMaps && !isGlobalAiOpen && !isGlobalVoiceOpen;

  return (
    <div
      className={`teralio-dashboard ${isFullPageMaps ? 'is-fullpage-maps-mode' : ''}`}
      data-testid="dashboard-page"
    >
      {/* 1. Collapsible & Extendable Left Navigation Sidebar */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggleExpand={handleToggleSidebar}
        activeNav={activeNav}
        onSelectNav={(id) => setActiveNav(id)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        user={profileUser}
      />

      {/* 2. Main Dashboard Canvas */}
      <main
        className={`dash-main ${isFullPageMaps ? 'is-fullpage-maps' : ''} ${
          isChatMode ? 'is-chat-mode' : ''
        } ${isScheduleMode ? 'is-schedule-mode' : ''} ${
          isCrossPageSidebarVisible ? 'has-crosspage-ai' : ''
        }`}
      >
        {/* Top Header Bar (Hidden in Full-Page Maps, Chat & Visit Schedule) */}
        {!isFullPageMaps && !isChatMode && !isScheduleMode && (
          <DashboardTopbar
            userName={profileUser.fullName.split(' ')[0] || 'Andreas'}
            subtitle="Let's look at your daily accommodation overview."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onUpgradeClick={handleUpgrade}
          />
        )}

        {/* Search Results Banner if user is filtering on Overview */}
        {query && activeNav !== 'discovery' && activeNav !== 'chat' && !isScheduleMode && (
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '18px',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.88rem', color: '#1e3a8a', fontWeight: 600 }}>
              Ditemukan {filteredListings.length} hunian untuk pencarian &ldquo;{searchQuery}&rdquo;
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setActiveNav('discovery')}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  background: '#1d77f2',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Lihat di Peta →
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  cursor: 'pointer',
                }}
              >
                Reset Filter
              </button>
            </div>
          </div>
        )}

        {/* 3. Primary View: 5-Card Bento Grid */}
        {activeNav === 'home' && (
          <>
            <div className="bento-top-grid">
              <HeroBannerCard
                onExploreVoice={handleOpenVoiceChat}
                onStartSession={() => handleOpenChat()}
              />
              <MatchStatusCard />
            </div>

            <div className="bento-bottom-grid">
              <CuratedKosCard onOpenKosInMap={handleCuratedKosMapClick} />
              <BudgetMeterCard />
              <ProximityWaveCard onOpenMaps={() => setActiveNav('discovery')} />
            </div>
          </>
        )}

        {/* 4. Smart Kos Match — Full-Page Interactive Platform Map View */}
        {activeNav === 'discovery' && (
          <SmartKosMapView
            user={profileUser}
            externalListings={backendItems}
            globalSearchQuery={searchQuery}
            onGlobalSearchChange={setSearchQuery}
            isSidebarExpanded={isSidebarExpanded}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onBackToOverview={() => setActiveNav('home')}
            onAskAi={(promptText) => handleOpenChat(promptText)}
            focusTarget={smartKosFocusTarget}
            onConsumeFocusTarget={() => setSmartKosFocusTarget(null)}
            onSurveyBooked={upsertBooking}
            onOpenSchedulePage={handleOpenScheduleFromAnywhere}
            onCatalogLoaded={handleCatalogLoaded}
            onCampusChanged={handleCampusChanged}
            sharedAiAssistant={sharedAiAssistant}
          />
        )}

        {/* 5. Unified TERALIO Chat & Realtime Voice Experience */}
        {activeNav === 'chat' && (
          <ChatWorkspace
            user={profileUser}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            pendingPrompt={pendingChatPrompt}
            onConsumePendingPrompt={() => setPendingChatPrompt('')}
            openVoiceSignal={openVoiceSignal}
            onOpenInSmartKos={(placeItem) => {
              setSmartKosFocusTarget(placeItem);
              setActiveNav('discovery');
            }}
            onUiAction={handleChatWorkspaceUiAction}
          />
        )}

        {/* 6. Visit Schedule — Kalender & Janji Temu */}
        {activeNav === 'schedule' && (
          <VisitScheduleView
            user={profileUser}
            bookings={surveyBookings}
            accommodations={accommodationsCatalog}
            highlightBookingId={highlightedBookingId}
            initialSelectedDate={selectedScheduleDate}
            onBookingsChange={setSurveyBookings}
            onOpenVoiceAssistant={openGlobalVoice}
            onViewKosOnMap={handleViewBookingOnMap}
            onBackToOverview={() => setActiveNav('home')}
          />
        )}

        {/* 7. Other Secondary Subview Panels */}
        {activeNav !== 'home' &&
          activeNav !== 'discovery' &&
          activeNav !== 'chat' &&
          activeNav !== 'schedule' && (
          <section className="subview-panel" data-testid={`subview-${activeNav}`}>
            <div className="subview-header">
              <div>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#8fa924',
                  }}
                >
                  TERALIO Space
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '2px' }}>
                  {activeNav === 'notifications' && 'Notifikasi & Update Ketersediaan Kamar'}
                  {activeNav === 'settings' && 'Preferensi Pencarian & Akun'}
                  {activeNav === 'system' && 'Status Infrastruktur Express & Supabase'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveNav('home')}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '999px',
                  background: '#f1f5f9',
                  color: '#0b0d10',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ← Back to Overview
              </button>
            </div>

            {/* Notifications View */}
            {activeNav === 'notifications' && (
              <NotificationsView
                onNavigate={(nav) => setActiveNav(nav)}
                onFocusKosOnMap={focusKosOnMap}
              />
            )}

            {/* Settings View */}
            {activeNav === 'settings' && (
              <div style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={profileUser.fullName}
                    style={{ width: '100%', marginTop: '4px', padding: '0.65rem 0.95rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    Peran / Status Kampus
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={profileUser.role}
                    style={{ width: '100%', marginTop: '4px', padding: '0.65rem 0.95rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                  />
                </div>
                {onLogout && (
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={onLogout}
                      style={{
                        padding: '0.65rem 1.45rem',
                        borderRadius: '999px',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fca5a5',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      Keluar dari Akun (Log Out)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* System View */}
            {activeNav === 'system' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>BACKEND API</span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>Express Server</h4>
                  <p style={{ fontSize: '0.82rem', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
                    ● {backendHealth?.status === 'ok' ? 'Online (200 OK)' : 'Online / Connected'}
                  </p>
                  <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                    Service: {backendHealth?.service || 'Teralio Express Backend'}
                  </p>
                </div>
                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>AI ORCHESTRATION</span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>OpenAI Responses &amp; Realtime</h4>
                  <p style={{ fontSize: '0.82rem', color: '#2563eb', marginTop: '6px', fontWeight: 600 }}>
                    ● SSE Stream &amp; WebRTC Ready (/api/openai/responses/stream)
                  </p>
                  <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                    Multi-round MCP tools, Visit Schedule &amp; In-Platform Map
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* 8. Cross-Page Voice & AI Sidebar (persisten — panggilan suara tidak terputus saat redirect halaman) */}
      {showCrossPageSidebar && (
        <SmartKosAiSidebar
          fixedMode
          isOpen={isGlobalAiOpen}
          isVoiceOpen={isGlobalVoiceOpen}
          onCloseSidebar={() => {
            setIsGlobalVoiceOpen(false);
            setIsGlobalAiOpen(false);
          }}
          onOpenVoice={openGlobalVoice}
          onCloseVoice={() => setIsGlobalVoiceOpen(false)}
          messages={globalAiMessages}
          isStreaming={globalIsStreaming}
          activeStatus={globalOrbStatus}
          onSelectKos={(kos) => focusKosOnMap(kos, { switchToMap: true })}
          onOpenSchedule={handleOpenScheduleFromAnywhere}
          composerValue={globalComposerText}
          onComposerChange={setGlobalComposerText}
          onSubmitPrompt={() => executeCrossPagePrompt(globalComposerText, { viaVoice: false })}
          onStopStreaming={handleGlobalStopStreaming}
          thinkingEnabled={globalThinkingEnabled}
          onToggleThinking={setGlobalThinkingEnabled}
          attachments={globalAttachments}
          onSelectFiles={handleGlobalSelectFiles}
          onRemoveAttachment={(localId) =>
            setGlobalAttachments((prev) => prev.filter((att) => att.localId !== localId))
          }
          onExecuteVoiceQuery={(utterance, hooks) =>
            executeCrossPagePrompt(utterance, { viaVoice: true, ...hooks })
          }
          onVoiceRealtimeTurn={handleGlobalVoiceTurn}
          onVoiceRealtimeRecommendations={handleGlobalVoiceRecommendations}
          onVoiceUiAction={handleGlobalVoiceUiAction}
          activeCampusName={activeCampusInfo?.name || 'Universitas Teknologi Bandung (UTB)'}
          activePageLabel={PAGE_LABELS[activeNav] || 'Dashboard'}
        />
      )}

      {/* 9. Floating Voice AI trigger di halaman non-peta */}
      {showCrossPageFab && (
        <button
          type="button"
          className="crosspage-voice-fab"
          onClick={openGlobalVoice}
          aria-label="Bicara dengan TERALIO Voice AI"
          title="Voice AI"
          data-testid="crosspage-voice-fab"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4.5 10v4M8.25 7v10M12 4.5v15M15.75 7.5v9M19.5 10v4"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default DashboardPage;
