import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import DashboardPage from '../pages/DashboardPage.jsx';
import { ChatWorkspace } from '../components/chat/ChatWorkspace.jsx';
import {
  ORB_ACTIVITY_PRESETS,
  VALID_ORB_VARIANTS,
  resolveSafeOrbProps,
} from '../components/chat/ThinkingOrbStage.jsx';

function buildSseResponse(frames) {
  const raw = frames
    .map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    .join('');

  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'Content-Type': 'text/event-stream' }),
    text: async () => raw,
  };
}

describe('TERALIO Unified Chat, Composer, Recommendation Sidebar, & Fullscreen Voice', () => {
  const originalRTCPeerConnection = globalThis.RTCPeerConnection;
  const originalMediaDevices = navigator.mediaDevices;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn(async (url) => {
      if (url === '/api/items') {
        return { ok: true, json: async () => ({ success: true, data: [] }) };
      }
      if (url === '/api/health') {
        return { ok: true, json: async () => ({ status: 'ok', service: 'Teralio Express Backend' }) };
      }
      return { ok: true, json: async () => ({ success: true }) };
    });
  });

  afterEach(() => {
    globalThis.RTCPeerConnection = originalRTCPeerConnection;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it('menyatukan navigasi menjadi satu menu "Chat" dan menampilkan empty state minimalis sesuai referensi', () => {
    render(<DashboardPage user={{ fullName: 'Andreas', email: 'andreas@teralio.com' }} />);

    // Pastikan menu sidebar bernama "Chat" dan tidak ada menu Voice terpisah
    const chatNavBtn = screen.getByTestId('nav-item-chat');
    expect(chatNavBtn).toHaveTextContent(/^Chat$/);
    expect(screen.queryByText(/Voice & Chat AI/i)).not.toBeInTheDocument();

    // Masuk ke halaman Chat
    fireEvent.click(chatNavBtn);

    // Topbar dashboard disembunyikan pada mode Chat
    expect(screen.queryByTestId('dashboard-topbar')).not.toBeInTheDocument();

    // Tampilan empty state minimalis
    expect(screen.getByTestId('teralio-chat-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('chat-empty-headline')).toHaveTextContent(
      'Sebaiknya kita mulai dari mana?'
    );
    expect(screen.queryByTestId('recommendation-sidebar')).not.toBeInTheDocument();
  });

  it('mengelola perilaku Message Composer: menu (+) Upload File/Image, Thinking On/Off tanpa model selector, serta transisi Wave <-> Send pada 1 karakter & lampiran', async () => {
    global.fetch = vi.fn(async (url) => {
      if (url === '/api/openai/files') {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: 'file-123',
              fileId: 'file-123',
              mode: 'openai_file',
              kind: 'image',
              filename: 'denah-kos.png',
              mimeType: 'image/png',
            },
          }),
        };
      }
      return { ok: true, json: async () => ({ success: true }) };
    });

    render(<ChatWorkspace user={{ fullName: 'Andreas' }} />);

    // 1. Hanya ada kontrol Thinking On/Off di kanan tengah (tidak ada model selector)
    const thinkingBtn = screen.getByTestId('composer-thinking-toggle');
    expect(thinkingBtn).toHaveAttribute('aria-pressed', 'false');
    expect(thinkingBtn).toHaveTextContent('Thinking Off');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    fireEvent.click(thinkingBtn);
    expect(thinkingBtn).toHaveAttribute('aria-pressed', 'true');
    expect(thinkingBtn).toHaveTextContent('Thinking On');

    // 2. Klik tombol Plus (+) menampilkan menu Upload File dan Upload Image
    fireEvent.click(screen.getByTestId('composer-plus-btn'));
    expect(screen.getByTestId('composer-attachment-menu')).toBeInTheDocument();
    expect(screen.getByTestId('composer-upload-file-btn')).toHaveTextContent('Upload File');
    expect(screen.getByTestId('composer-upload-image-btn')).toHaveTextContent('Upload Image');

    // 3. Saat kosong, tombol paling kanan adalah ikon Wave statis
    expect(screen.getByTestId('composer-wave-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('composer-send-btn')).not.toBeInTheDocument();

    // 4. Ketik hanya 1 karakter -> langsung berubah menjadi tombol Send
    const input = screen.getByTestId('chat-composer-input');
    fireEvent.change(input, { target: { value: 'K' } });
    expect(screen.getByTestId('composer-send-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('composer-wave-btn')).not.toBeInTheDocument();

    // 5. Hapus seluruh teks -> kembali menjadi ikon Wave
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByTestId('composer-wave-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('composer-send-btn')).not.toBeInTheDocument();

    // 6. Unggah attachment tanpa teks -> berubah menjadi tombol Send, dan kembali ke Wave saat dihapus
    const imageInput = screen.getByTestId('composer-image-input');
    const mockFile = new File(['png-bytes'], 'denah-kos.png', { type: 'image/png' });
    fireEvent.change(imageInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('composer-send-btn')).not.toBeDisabled();
    });
    expect(screen.getByText('denah-kos.png')).toBeInTheDocument();

    const removeBtn = screen.getByLabelText('Hapus lampiran denah-kos.png');
    fireEvent.click(removeBtn);
    expect(screen.getByTestId('composer-wave-btn')).toBeInTheDocument();
  });

  it('menjalankan streaming SSE progresif dan membuka Dynamic Recommendation Sidebar hanya ketika rekomendasi tempat valid tersedia', async () => {
    let callCount = 0;
    global.fetch = vi.fn(async (url) => {
      if (url === '/api/openai/responses/stream') {
        callCount += 1;
        if (callCount === 1) {
          // Turn 1: Pertanyaan umum (tidak ada rekomendasi lokasi) -> sidebar tetap tertutup
          return buildSseResponse([
            { event: 'status', data: { orbState: 'reasoning', variant: 'default', label: 'Memproses...' } },
            { event: 'text_delta', data: { delta: 'Pastikan ventilasi dan keamanan kos baik.' } },
            {
              event: 'done',
              data: {
                responseId: 'resp_general_1',
                outputText: 'Pastikan ventilasi dan keamanan kos baik.',
                recommendations: { hasValidRecommendations: false, items: [] },
              },
            },
          ]);
        }

        // Turn 2: Pencarian kos di Bandung dengan data tempat terverifikasi -> sidebar terbuka otomatis
        return buildSseResponse([
          { event: 'status', data: { orbState: 'working', variant: 'gyro', label: 'Mencari lokasi...' } },
          {
            event: 'recommendations',
            data: {
              hasValidRecommendations: true,
              queryContext: 'kos dekat ITB Bandung',
              items: [
                {
                  id: 'gmaps:ChIJ_cisitu_01',
                  source: 'google_maps',
                  sourceLabel: 'Google Maps',
                  name: 'Cisitu Loft Boarding House',
                  category: 'Kos Mahasiswa',
                  description: 'Hunian tenang 700m dari kampus ITB Ganesha.',
                  address: 'Jl. Cisitu Indah VI No. 12, Coblong, Bandung',
                  location: { lat: -6.8815, lng: 107.6112 },
                  price: 'Rp1.750.000 / bln',
                  contact: { phone: '+62 812-9988-7766', website: null },
                  rating: 4.8,
                  userRatingCount: 64,
                  routeSummary: {
                    distanceText: '700 m',
                    durationText: '9 mnt',
                    targetLabel: 'ITB Ganesha',
                  },
                  mapUrl: 'https://maps.google.com/?cid=889900',
                },
              ],
            },
          },
          { event: 'text_delta', data: { delta: 'Saya menemukan **Cisitu Loft Boarding House** ' } },
          { event: 'text_delta', data: { delta: 'di kawasan Coblong, Bandung.' } },
          {
            event: 'done',
            data: {
              responseId: 'resp_kos_2',
              outputText: 'Saya menemukan **Cisitu Loft Boarding House** di kawasan Coblong, Bandung.',
            },
          },
        ]);
      }
      return { ok: true, json: async () => ({ success: true }) };
    });

    render(<ChatWorkspace user={{ fullName: 'Andreas' }} />);

    const input = screen.getByTestId('chat-composer-input');

    // Turn 1: Pertanyaan umum -> Sidebar TIDAK terbuka
    fireEvent.change(input, { target: { value: 'Apa tips memilih kos sehat?' } });
    fireEvent.click(screen.getByTestId('composer-send-btn'));

    await waitFor(() => {
      expect(screen.getByText('Pastikan ventilasi dan keamanan kos baik.')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('recommendation-sidebar')).not.toBeInTheDocument();

    // Turn 2: Pertanyaan lokasi kos -> Sidebar rekomendasi terbuka otomatis dengan data nyata
    fireEvent.change(input, { target: { value: 'Carikan tempat kos di sekitar Bandung dekat ITB' } });
    fireEvent.click(screen.getByTestId('composer-send-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('recommendation-sidebar')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Cisitu Loft Boarding House').length).toBeGreaterThan(0);
    expect(screen.getByText('Jl. Cisitu Indah VI No. 12, Coblong, Bandung')).toBeInTheDocument();
    expect(screen.getByText('+62 812-9988-7766')).toBeInTheDocument();
    expect(screen.getByText(/700 m • 9 mnt ke ITB Ganesha/i)).toBeInTheDocument();
    expect(screen.getByTestId('open-maps-link-gmaps:ChIJ_cisitu_01')).toHaveAttribute(
      'href',
      'https://maps.google.com/?cid=889900'
    );
  });

  it('memetakan seluruh 9 state resmi @yogesharc/thinking-orbs secara presisi dan menolak state ilegal', () => {
    const expectedStates = [
      'idle',
      'working',
      'reasoning',
      'searching',
      'background',
      'retrying',
      'compacting',
      'waiting',
      'using',
    ];
    expect(Object.keys(VALID_ORB_VARIANTS).sort()).toEqual(expectedStates.sort());

    // Pastikan setiap preset aktivitas menghasilkan pasangan state & variant valid
    for (const preset of Object.values(ORB_ACTIVITY_PRESETS)) {
      const safe = resolveSafeOrbProps(preset.state, preset.variant);
      expect(safe).toEqual(preset);
    }

    // Pastikan state di luar kontrak library diamankan ke idle/default
    expect(resolveSafeOrbProps('speaking_nonexistent', 'invalid_variant')).toEqual({
      state: 'idle',
      variant: 'default',
    });
  });

  it('membuka Fullscreen Voice Conversation dengan Thinking Orbs, menjalankan WebRTC dua arah, dan menyinkronkan transkrip ke Chat', async () => {
    let dataChannelInstance = null;

    class MockRTCPeerConnection {
      constructor() {
        this.connectionState = 'connected';
        this.ontrack = null;
        this.onconnectionstatechange = null;
      }
      addTrack() {}
      createDataChannel(label) {
        dataChannelInstance = {
          label,
          readyState: 'open',
          onopen: null,
          onmessage: null,
          send: vi.fn(),
          close: vi.fn(),
        };
        return dataChannelInstance;
      }
      async createOffer() {
        return { type: 'offer', sdp: 'v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\n' };
      }
      async setLocalDescription() {}
      async setRemoteDescription() {}
      close() {}
    }

    globalThis.RTCPeerConnection = MockRTCPeerConnection;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getAudioTracks: () => [{ enabled: true, stop: vi.fn() }],
          getTracks: () => [{ enabled: true, stop: vi.fn() }],
        }),
      },
    });

    global.fetch = vi.fn(async (url) => {
      if (url === '/api/realtime/client-secrets') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              clientSecret: { value: 'ek_live_ephemeral_test', expiresAt: 9999999999 },
              webrtc: {
                callsUrl: 'https://api.openai.com/v1/realtime/calls',
                dataChannelLabel: 'oai-events',
              },
            },
          }),
        };
      }
      if (url === 'https://api.openai.com/v1/realtime/calls') {
        return {
          ok: true,
          status: 201,
          headers: new Headers({ location: 'https://api.openai.com/v1/realtime/calls/rtc_call_77' }),
          text: async () => 'v=0\r\no=- 2 2 IN IP4 127.0.0.1\r\n',
        };
      }
      return { ok: true, json: async () => ({ success: true }) };
    });

    render(<ChatWorkspace user={{ fullName: 'Andreas' }} />);

    // Klik ikon Wave pada composer -> buka Fullscreen Voice Conversation
    fireEvent.click(screen.getByTestId('composer-wave-btn'));
    const overlay = screen.getByTestId('fullscreen-voice-overlay');
    expect(overlay).toBeInTheDocument();

    const orbHero = screen.getByTestId('thinking-orb-hero');

    // Voice langsung terhubung otomatis (AI menyapa duluan) tanpa perlu klik Start Conversation
    await waitFor(() => {
      expect(screen.getByTestId('voice-active-controls')).toBeInTheDocument();
    });
    expect(screen.getByTestId('voice-end-btn')).toHaveTextContent(/Selesaikan Conversation/i);
    expect(orbHero).toHaveAttribute('data-voice-phase', 'listening');
    expect(orbHero).toHaveAttribute('data-orb-state', 'idle');
    expect(orbHero).toHaveAttribute('data-orb-variant', 'blink');

    // Simulasikan alur event suara full-duplex pada DataChannel 'oai-events'
    await act(async () => {
      dataChannelInstance.onmessage({
        data: JSON.stringify({ type: 'input_audio_buffer.speech_started' }),
      });
    });
    expect(orbHero).toHaveAttribute('data-voice-phase', 'user_speaking');

    await act(async () => {
      dataChannelInstance.onmessage({
        data: JSON.stringify({ type: 'input_audio_buffer.speech_stopped' }),
      });
    });
    expect(orbHero).toHaveAttribute('data-voice-phase', 'processing_voice');
    expect(orbHero).toHaveAttribute('data-orb-state', 'reasoning');

    await act(async () => {
      dataChannelInstance.onmessage({
        data: JSON.stringify({
          type: 'conversation.item.input_audio_transcription.completed',
          item_id: 'usr_v_1',
          transcript: 'Carikan kos dekat kampus di Bandung',
        }),
      });
      dataChannelInstance.onmessage({
        data: JSON.stringify({ type: 'output_audio_buffer.started' }),
      });
    });
    expect(orbHero).toHaveAttribute('data-voice-phase', 'ai_speaking');
    expect(orbHero).toHaveAttribute('data-orb-state', 'working');

    await act(async () => {
      dataChannelInstance.onmessage({
        data: JSON.stringify({
          type: 'response.output_audio_transcript.done',
          item_id: 'ast_v_1',
          transcript: 'Baik, saya carikan kos terbaik di sekitar Bandung.',
        }),
      });
    });

    // Tutup Fullscreen Voice -> pastikan transkrip percakapan suara tersinkron ke halaman Chat utama
    fireEvent.click(screen.getByTestId('voice-close-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('fullscreen-voice-overlay')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Carikan kos dekat kampus di Bandung')).toBeInTheDocument();
    expect(screen.getByText('Baik, saya carikan kos terbaik di sekitar Bandung.')).toBeInTheDocument();
  });

  it('mendukung Structured Output (tabel markdown interaktif, badge tipe, harga) dan metrik Throughput tok/s', async () => {
    let capturedRequestBody = null;
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url === '/api/openai/responses/stream') {
        capturedRequestBody = JSON.parse(opts.body);
        return buildSseResponse([
          {
            event: 'text_delta',
            data: {
              delta:
                'Di Bandung, TERALIO mencatat **8 pilihan kos**:\n\n| Kos | Tipe | Harga |\n\n|---|---|---:|\n\n| Bojongsoang Suites | Putri | Rp1.150.000 |\n\n| Sukapura Loft | Campur | Rp1.350.000 |\n\nSilakan pilih kos favorit Anda.',
            },
          },
          {
            event: 'done',
            data: {
              responseId: 'resp_table_1',
              outputText:
                'Di Bandung, TERALIO mencatat **8 pilihan kos**:\n\n| Kos | Tipe | Harga |\n\n|---|---|---:|\n\n| Bojongsoang Suites | Putri | Rp1.150.000 |\n\n| Sukapura Loft | Campur | Rp1.350.000 |\n\nSilakan pilih kos favorit Anda.',
              metrics: {
                elapsedSeconds: 1.2,
                outputTokens: 240,
                throughput: 52.4,
                isDeepThinking: true,
              },
            },
          },
        ]);
      }
      return { ok: true, json: async () => ({ success: true }) };
    });

    render(<ChatWorkspace user={{ fullName: 'Andreas' }} />);

    // Aktifkan mode Thinking (High Reasoning)
    const thinkingBtn = screen.getByTestId('composer-thinking-toggle');
    fireEvent.click(thinkingBtn);
    expect(thinkingBtn).toHaveTextContent('Thinking On');

    const input = screen.getByTestId('chat-composer-input');
    fireEvent.change(input, { target: { value: 'Tampilkan perbandingan kos dalam tabel' } });
    fireEvent.click(screen.getByTestId('composer-send-btn'));

    // Pastikan request mengirim reasoningEffort: 'high'
    await waitFor(() => {
      expect(capturedRequestBody?.reasoningEffort).toBe('high');
    });

    // Verifikasi Structured Output Tabel
    await waitFor(() => {
      expect(screen.getByTestId('chat-markdown-table')).toBeInTheDocument();
    });

    expect(screen.getByText('Bojongsoang Suites')).toBeInTheDocument();
    expect(screen.getByText('Sukapura Loft')).toBeInTheDocument();
    expect(screen.getByText('Putri')).toHaveClass('table-badge');
    expect(screen.getByText('Campur')).toHaveClass('table-badge');
    expect(screen.getByText('8 pilihan kos')).toHaveClass('chat-bold');

    // Merek dinormalisasi tidak capslock ("Teralio")
    expect(screen.getByText(/Teralio mencatat/i)).toBeInTheDocument();
    expect(screen.queryByText(/TERALIO/)).not.toBeInTheDocument();

    // Metrik token dihilangkan sesuai permintaan pengguna ("gausah")
    expect(screen.queryByTestId('chat-metrics-bar')).not.toBeInTheDocument();
    expect(screen.queryByText(/tok\/s/)).not.toBeInTheDocument();
  });
});
