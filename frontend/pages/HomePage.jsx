import React, { useState, useEffect } from 'react';
import SupabaseStatus from '../components/SupabaseStatus.jsx';
import OpenAiCard from '../components/OpenAiCard.jsx';
import ItemCard from '../components/ItemCard.jsx';

export const HomePage = () => {
  const [backendHealth, setBackendHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [items, setItems] = useState([]);
  const [itemsSource, setItemsSource] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);

  const checkBackend = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setBackendHealth({ status: 'ok', data });
    } catch (err) {
      setBackendHealth({ status: 'error', message: err.message });
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch('/api/items');
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
        setItemsSource(json.source);
      }
    } catch (err) {
      console.warn('Gagal memuat item dari backend:', err.message);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    checkBackend();
    fetchItems();
  }, []);

  return (
    <main className="page-container" data-testid="home-page">
      <section className="hero-section">
        <h1 className="hero-title">Teralio Fullstack Platform</h1>
        <p className="hero-subtitle">
          Vite (React) + Express Backend + Inisialisasi Supabase Database & Integrasi OpenAI.
          Siap dijalankan secara lokal maupun dideploy ke Vercel tanpa kendala.
        </p>
      </section>

      <section className="dashboard-grid">
        {/* Card Supabase Frontend */}
        <SupabaseStatus />

        {/* Card Backend Express */}
        <div className="card" data-testid="backend-status-card">
          <h3 className="card-title">
            <span>🚀</span> Status Express Backend
          </h3>
          <div className="card-content">
            <p>
              Status Server:{' '}
              {backendHealth?.status === 'ok' ? (
                <span className="status-indicator connected">✅ Online (200 OK)</span>
              ) : backendHealth?.status === 'error' ? (
                <span className="status-indicator error">❌ Offline (Belum Dinyalakan)</span>
              ) : (
                <span className="status-indicator pending">⏳ Memeriksa...</span>
              )}
            </p>

            {backendHealth?.data && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                <strong>Layanan:</strong> {backendHealth.data.service} <br />
                <strong>Uptime:</strong> {Math.round(backendHealth.data.uptime)} detik
              </p>
            )}

            <div style={{ marginTop: '1rem' }}>
              <button
                className="btn btn-secondary"
                onClick={checkBackend}
                disabled={loadingHealth}
                data-testid="test-backend-btn"
              >
                {loadingHealth ? 'Memeriksa...' : '🔄 Uji Ulang Koneksi Backend'}
              </button>
            </div>
          </div>
        </div>

        {/* Card OpenAI Chatbot / Tester */}
        <OpenAiCard />
      </section>

      {/* Card Struktur Folder */}
      <section className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 className="card-title">
          <span>📁</span> Struktur Project Teralio Sesuai Permintaan
        </h3>
        <div className="card-content">
          <pre
            style={{
              background: '#0f172a',
              color: '#38bdf8',
              padding: '1rem',
              borderRadius: '8px',
              overflowX: 'auto',
              fontSize: '0.88rem',
              lineHeight: '1.4',
            }}
          >
{`project/
├── frontend/
│   ├── components/
│   ├── pages/
│   └── styles/
├── backend/
│   ├── api/
│   ├── services/
│   └── models/
├── docs/
└── README.md`}
          </pre>
        </div>
      </section>

      {/* Card Items */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">
            <span>📦</span> Data Items API {itemsSource ? `(${itemsSource})` : ''}
          </h3>
          <button className="btn btn-secondary" onClick={fetchItems} disabled={loadingItems}>
            {loadingItems ? 'Memuat...' : 'Muat Ulang'}
          </button>
        </div>

        <div className="items-list">
          {items.length > 0 ? (
            items.map((item) => <ItemCard key={item.id} item={item} />)
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {loadingItems ? 'Sedang memuat data...' : 'Tidak ada data item yang dimuat.'}
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default HomePage;
