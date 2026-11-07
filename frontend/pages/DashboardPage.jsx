import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import DashboardTopbar from '../components/DashboardTopbar.jsx';
import HeroBannerCard from '../components/HeroBannerCard.jsx';
import MatchStatusCard from '../components/MatchStatusCard.jsx';
import CuratedKosCard from '../components/CuratedKosCard.jsx';
import BudgetMeterCard from '../components/BudgetMeterCard.jsx';
import ProximityWaveCard from '../components/ProximityWaveCard.jsx';
import SmartKosMapView from '../components/SmartKosMapView.jsx';
import ChatWorkspace from '../components/chat/ChatWorkspace.jsx';
import { fireConfetti } from '../utils/confetti.js';
import '../styles/dashboard.css';

const DEFAULT_RECOMMENDED_KOS = [
  {
    id: 'kos-1',
    name: 'Kos Harmoni Sukapura',
    price: 'Rp1.250.000 / bln',
    distance: '650m dari Kampus',
    type: 'Putra / Putri',
    tag: 'Match 96%',
    features: ['Kamar Mandi Dalam', 'Wi-Fi 100 Mbps', 'Kasur Springbed', 'Meja Belajar'],
  },
  {
    id: 'kos-2',
    name: 'Sukapura Loft Residence',
    price: 'Rp1.350.000 / bln',
    distance: '820m dari Kampus',
    type: 'Campur',
    tag: 'Quiet Area',
    features: ['Water Heater', 'Smart Lock', 'Balkon', 'Dapur Bersama'],
  },
  {
    id: 'kos-3',
    name: 'Bojongsoang Green Suites',
    price: 'Rp1.150.000 / bln',
    distance: '950m dari Kampus',
    type: 'Putri',
    tag: 'Best Value',
    features: ['Listrik Termasuk', 'CCTV 24 Jam', 'Parkir Motor', 'Laundry'],
  },
];

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
  const [backendItems, setBackendItems] = useState([]);
  const [backendHealth, setBackendHealth] = useState(null);

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

  // Fetch backend accommodation items & health on mount
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

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Filter listings based on search bar
  const query = searchQuery.trim().toLowerCase();
  const allListings = backendItems.length > 0 ? backendItems : DEFAULT_RECOMMENDED_KOS;
  const filteredListings = query
    ? allListings.filter(
        (item) =>
          (item.name || item.title || '').toLowerCase().includes(query) ||
          (item.distance || item.category || '').toLowerCase().includes(query) ||
          (item.features || []).some((f) => f.toLowerCase().includes(query))
      )
    : allListings;

  const isFullPageMaps = activeNav === 'discovery';
  const isChatMode = activeNav === 'chat';

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
        }`}
      >
        {/* Top Header Bar (Hidden in Full-Page Google Maps & Clean Chat Mode) */}
        {!isFullPageMaps && !isChatMode && (
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
        {query && activeNav !== 'discovery' && activeNav !== 'chat' && (
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
                Lihat di Google Maps →
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
            {/* Top Bento Row: Hero Card (1.38fr) + Status Card (1fr) */}
            <div className="bento-top-grid">
              <HeroBannerCard
                onExploreVoice={handleOpenVoiceChat}
                onStartSession={() => handleOpenChat()}
              />
              <MatchStatusCard />
            </div>

            {/* Bottom Bento Row: 3 White Equal Cards */}
            <div className="bento-bottom-grid">
              <CuratedKosCard />
              <BudgetMeterCard />
              <ProximityWaveCard onOpenMaps={() => setActiveNav('discovery')} />
            </div>
          </>
        )}

        {/* 4. Smart Kos Match — 100% Full-Page Interactive Google Maps View */}
        {activeNav === 'discovery' && (
          <SmartKosMapView
            externalListings={backendItems}
            globalSearchQuery={searchQuery}
            onGlobalSearchChange={setSearchQuery}
            isSidebarExpanded={isSidebarExpanded}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onBackToOverview={() => setActiveNav('home')}
            onAskAi={(promptText) => handleOpenChat(promptText)}
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
          />
        )}

        {/* 6. Other Secondary Subview Panels */}
        {activeNav !== 'home' && activeNav !== 'discovery' && activeNav !== 'chat' && (
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
                  {activeNav === 'schedule' && 'Jadwal Survei & Janji Temu Pemilik Kos'}
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

            {/* Schedule View */}
            {activeNav === 'schedule' && (
              <div style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <strong>Jadwal Kunjungan: Kos Harmoni Sukapura</strong>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                    Sabtu, 14:00 WIB • Bertemu dengan Ibu Kos (Bapak Herman) • Radius 650m
                  </p>
                </div>
                <p>Belum ada jadwal survei lainnya. Klik &quot;Explore Now&quot; di Home untuk membuat jadwal baru melalui AI.</p>
              </div>
            )}

            {/* Notifications View */}
            {activeNav === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px' }}>
                  <strong style={{ color: '#166534', fontSize: '0.9rem' }}>🎉 Kamar Baru Tersedia!</strong>
                  <p style={{ color: '#15803d', fontSize: '0.82rem', marginTop: '2px' }}>
                    Sukapura Loft membuka 1 kamar lantai 2 (kamar mandi dalam, Rp1.350.000).
                  </p>
                </div>
                <div style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px' }}>
                  <strong style={{ color: '#1e40af', fontSize: '0.9rem' }}>⚡ Wi-Fi Speed Verified</strong>
                  <p style={{ color: '#1d4ed8', fontSize: '0.82rem', marginTop: '2px' }}>
                    Kos Harmoni telah diverifikasi memiliki kecepatan 100 Mbps fiber optic stabil.
                  </p>
                </div>
              </div>
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
                    Multi-round MCP tools, Web Search &amp; Google Maps
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
