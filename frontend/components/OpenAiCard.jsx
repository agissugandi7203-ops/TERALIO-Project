import React, { useState, useEffect } from 'react';

export const OpenAiCard = () => {
  const [status, setStatus] = useState(null);
  const [inputPrompt, setInputPrompt] = useState('Halo Teralio, jelaskan apa keunggulan arsitektur ini?');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/openai/status');
      const json = await res.json();
      if (json.success) {
        setStatus(json.data);
      }
    } catch (err) {
      console.warn('Gagal memuat status OpenAI:', err.message);
    }
  };

  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!inputPrompt.trim()) return;

    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputPrompt }),
      });
      const json = await res.json();
      if (json.success) {
        setResponse(json.data.response);
      } else {
        setResponse(`Error: ${json.message}`);
      }
    } catch (err) {
      setResponse(`Gagal terhubung ke API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="card" data-testid="openai-card" style={{ gridColumn: '1 / -1' }}>
      <h3 className="card-title">
        <span>🤖</span> Integrasi OpenAI Assistant (Teralio)
      </h3>
      <div className="card-content">
        <p>
          Status Kredensial:{' '}
          {status?.configured ? (
            <span className="status-indicator connected">✅ API Key Aktif ({status.model})</span>
          ) : (
            <span className="status-indicator pending">⚠️ Menggunakan Mode Simulasi / Dev</span>
          )}
        </p>

        <form onSubmit={handleSendChat} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Tulis pesan atau prompt untuk AI..."
            data-testid="openai-input"
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '0.6rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.9rem',
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            data-testid="openai-send-btn"
          >
            {loading ? 'Mengirim...' : '🚀 Kirim ke OpenAI'}
          </button>
        </form>

        {response && (
          <div
            data-testid="openai-response-box"
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              fontSize: '0.9rem',
              lineHeight: '1.5',
            }}
          >
            <strong>Respon AI:</strong>
            <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{response}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenAiCard;
