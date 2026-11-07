import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SmartKosMapView from '../components/SmartKosMapView.jsx';

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

const SAMPLE_CATALOG = [
  {
    id: 'kos-1',
    campusId: 'telkom',
    campusName: 'Telkom University Bandung',
    city: 'Bandung',
    area: 'Sukapura',
    name: 'Kos Harmoni Sukapura',
    address: 'Jl. Sukapura No. 18, Dayeuhkolot, Bandung',
    lat: -6.9708,
    lng: 107.6334,
    priceMonthly: 1250000,
    price: 'Rp1.250.000 / bln',
    distance: '650m dari Gerbang Sukapura',
    type: 'Putra / Putri',
    matchScore: 96,
    tag: 'Match 96%',
    rating: 4.9,
    reviewsCount: 48,
    roomsAvailable: 2,
    visitingHours: 'Setiap hari • 08.00 – 21.00 WIB',
    verified: true,
    description: 'Hunian mahasiswa modern dengan fiber optic 100 Mbps.',
    contact: { ownerName: 'Bapak Herman Pratama', phone: '+62 812-2104-8891' },
    features: ['Kamar Mandi Dalam', 'Wi-Fi 100 Mbps'],
    nearbyLandmarks: [{ name: 'Gerbang Sukapura', distance: '650 m' }],
    reviews: [{ author: 'Raka', rating: 5, comment: 'Internet cepat dan bersih.' }],
    accentPalette: ['#1d4ed8', '#38bdf8'],
  },
  {
    id: 'kos-itb-1',
    campusId: 'itb',
    campusName: 'Institut Teknologi Bandung (Ganesha)',
    city: 'Bandung',
    area: 'Cisitu, Dago',
    name: 'Cisitu Indah Smart Kost',
    address: 'Jl. Cisitu Indah VI No. 12, Dago, Bandung',
    lat: -6.8828,
    lng: 107.6114,
    priceMonthly: 1650000,
    price: 'Rp1.650.000 / bln',
    distance: '890m dari ITB Ganesha',
    type: 'Putra / Putri',
    matchScore: 97,
    tag: 'Match 97%',
    rating: 4.9,
    reviewsCount: 52,
    roomsAvailable: 2,
    visitingHours: 'Setiap hari • 08.30 – 21.00 WIB',
    verified: true,
    description: 'Kos udara sejuk Cisitu dengan solar water heater.',
    contact: { ownerName: 'Bapak Ir. Arif Budiman', phone: '+62 812-2040-7711' },
    features: ['Water Heater Sentral', 'Wi-Fi 100 Mbps', 'Rooftop Lounge'],
    nearbyLandmarks: [{ name: 'Sabuga ITB', distance: '890 m' }],
    reviews: [{ author: 'Fajar (STEI ITB)', rating: 5, comment: 'Air hangat selalu stabil.' }],
    accentPalette: ['#0284c7', '#38bdf8'],
  },
];

describe('Smart Kos Match — Right Conversation Sidebar, Voice Orb Overlay, & Native Place Overview', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn(async (url, opts) => {
      if (typeof url === 'string' && url.startsWith('/api/accommodations/ai-search/stream')) {
        const body = JSON.parse(opts?.body || '{}');
        const isItb = /itb|dago|water heater/i.test(body.message || '');
        const target = isItb ? SAMPLE_CATALOG[1] : SAMPLE_CATALOG[0];

        return buildSseResponse([
          {
            event: 'status',
            data: {
              orbState: 'reasoning',
              variant: 'twins',
              step: 'intent',
              label: 'Menganalisis kriteria lokasi & budget...',
            },
          },
          {
            event: 'status',
            data: {
              orbState: 'searching',
              variant: 'lighthouse',
              step: 'database',
              label: 'Mencari kos terdekat berdasarkan database Supabase...',
            },
          },
          {
            event: 'redirect_location',
            data: {
              campusId: target.campusId,
              targetKos: target,
              matchedAccommodations: [target],
              route: {
                distanceMeters: 720,
                distanceText: '720 m',
                walkMinutes: 9,
                rideMinutes: 3,
                geometry: [
                  [-6.8915, 107.6107],
                  [target.lat, target.lng],
                ],
              },
              dataSource: 'supabase',
            },
          },
          {
            event: 'text_delta',
            data: { delta: `Saya mengarahkan peta ke **${target.name}** (${target.price}).` },
          },
          {
            event: 'done',
            data: {
              responseId: 'sk_resp_1',
              outputText: `Saya mengarahkan peta ke **${target.name}** (${target.price}).`,
              voiceSummary: `Saya menemukan ${target.name} dengan tarif ${target.price}.`,
              campusId: target.campusId,
              targetKos: target,
              matchedAccommodations: [target],
              dataSource: 'supabase',
            },
          },
        ]);
      }

      if (url === '/api/accommodations/bookings' && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: 'srv_live_01',
              ...body,
              status: 'Terjadwal',
            },
          }),
        };
      }

      if (typeof url === 'string' && url.startsWith('/api/accommodations/route')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              distanceMeters: 650,
              distanceText: '650 m',
              walkMinutes: 8,
              rideMinutes: 3,
              geometry: [
                [-6.9733, 107.6305],
                [-6.9708, 107.6334],
              ],
            },
          }),
        };
      }

      if (typeof url === 'string' && url.startsWith('/api/accommodations')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            source: 'supabase',
            data: SAMPLE_CATALOG,
          }),
        };
      }

      return { ok: true, json: async () => ({ success: true }) };
    });
  });

  it('menyembunyikan Sidebar Kanan di awal, lalu membukanya bersama Thinking Orbs & Place Overview saat user mengirim prompt', async () => {
    render(<SmartKosMapView user={{ fullName: 'Andreas' }} />);

    // 1. Peta In-Platform tampil tanpa iframe eksternal, dan Sidebar Kanan + Overview masih tertutup
    const mapCanvas = screen.getByTestId('in-platform-map-canvas');
    expect(mapCanvas).toBeInTheDocument();
    expect(screen.queryByTestId('smart-kos-ai-sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kos-place-overview')).not.toBeInTheDocument();

    // 2. Kirim prompt pencarian kos di ITB Dago
    fireEvent.change(screen.getByTestId('chat-composer-input'), {
      target: { value: 'Carikan kos dekat ITB Dago yang ada water heater' },
    });
    fireEvent.click(screen.getByTestId('composer-send-btn'));

    // 3. Sidebar Percakapan Kanan aktif, peta otomatis redirect ke Cisitu Indah Smart Kost, & Place Overview terbuka!
    await waitFor(() => {
      expect(screen.getByTestId('smart-kos-ai-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('kos-place-overview')).toBeInTheDocument();
    });

    expect(screen.getByTestId('place-overview-title')).toHaveTextContent('Cisitu Indah Smart Kost');
    expect(screen.getByTestId('in-platform-map-canvas')).toHaveAttribute(
      'data-selected-kos-id',
      'kos-itb-1',
    );
    expect(screen.getByTestId('thinking-orb-inline')).toBeInTheDocument();

    // 4. Uji penjadwalan survei dinamis langsung dari Place Overview
    fireEvent.click(screen.getByTestId('overview-action-survey'));
    expect(screen.getByTestId('overview-survey-box')).toBeInTheDocument();

    const slotButtons = screen.getAllByTestId('overview-survey-slot-btn');
    expect(slotButtons.length).toBe(3);
    fireEvent.click(slotButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('overview-survey-confirmed')).toBeInTheDocument();
    });
  });

  it('saat klik Wave, membuka Voice Orb Overlay menutupi Sidebar Kanan (tanpa menutupi peta), menampilkan indikator database, dan auto-redirect ke lokasi kos', async () => {
    render(<SmartKosMapView user={{ fullName: 'Andreas' }} />);

    // Klik ikon Wave pada composer bawah peta
    fireEvent.click(screen.getByTestId('composer-wave-btn'));

    // Peta kiri tetap terlihat, sementara Sidebar Kanan terbuka dengan ditutupi Voice Orb Overlay (#3)
    expect(screen.getByTestId('in-platform-map-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('smart-kos-ai-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('smart-kos-voice-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('thinking-orb-hero')).toBeInTheDocument();
    expect(screen.getByTestId('voice-db-progress-steps')).toBeInTheDocument();

    // Jalankan perintah suara cepat ("Carikan kos sekitar ITB Dago yang ada water heater")
    const quickVoiceButtons = screen.getAllByTestId('voice-quick-utterance-btn');
    const itbVoiceBtn = quickVoiceButtons.find((btn) =>
      btn.textContent.includes('ITB Dago'),
    );
    fireEvent.click(itbVoiceBtn);

    // Peta otomatis redirect ke koordinat Cisitu Indah Smart Kost (-6.8828, 107.6114) & Place Overview langsung terbuka!
    await waitFor(() => {
      expect(screen.getByTestId('smart-kos-voice-redirect-banner')).toBeInTheDocument();
      expect(screen.getByTestId('kos-place-overview')).toBeInTheDocument();
    });

    expect(screen.getByTestId('place-overview-title')).toHaveTextContent('Cisitu Indah Smart Kost');
    expect(screen.getByTestId('in-platform-map-canvas')).toHaveAttribute('data-lat', '-6.8828');
    expect(screen.getByTestId('in-platform-map-canvas')).toHaveAttribute('data-lng', '107.6114');
  });
});
