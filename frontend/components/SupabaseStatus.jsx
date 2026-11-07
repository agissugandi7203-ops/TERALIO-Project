import React from 'react';
import { getSupabaseInfo } from '../supabaseClient.js';

export const SupabaseStatus = () => {
  const { url, hasAnonKey, isConfigured } = getSupabaseInfo();

  return (
    <div className="card" data-testid="supabase-status-card">
      <h3 className="card-title">
        <span>⚡</span> Status Supabase Frontend
      </h3>
      <div className="card-content">
        <p>
          Status Klien:{' '}
          {isConfigured ? (
            <span className="status-indicator connected">✅ Terhubung ke Supabase</span>
          ) : (
            <span className="status-indicator pending">⚠️ Menggunakan Placeholder Credentials</span>
          )}
        </p>

        <p style={{ marginTop: '0.75rem' }}>
          <strong>URL:</strong> <code>{url || '(Belum diset)'}</code>
        </p>
        <p style={{ marginTop: '0.25rem' }}>
          <strong>Anon Key:</strong> {hasAnonKey ? 'Tersedia ✅' : 'Tidak Ditemukan ❌'}
        </p>

        {!isConfigured && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#b45309' }}>
            💡 Masukkan kredensial Supabase Anda di file <code>frontend/.env</code> pada <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        )}
      </div>
    </div>
  );
};

export default SupabaseStatus;
