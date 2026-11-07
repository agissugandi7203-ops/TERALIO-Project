import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import {
  accommodationsService,
  fromSupabaseRow,
  parseSmartKosIntent,
  toSupabaseRow,
} from '../services/accommodationsService.js';

function parseSseFrames(rawText) {
  return rawText
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      let event = 'message';
      let dataStr = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
      }
      return { event, data: dataStr ? JSON.parse(dataStr) : null };
    });
}

describe('Smart Kos Match — Supabase Mapping, Dynamic Search, SSE Redirect, & Survey Bookings', () => {
  beforeEach(() => {
    accommodationsService._resetRuntimeBookingsForTesting();
  });

  it('memetakan skema objek kos ke baris PostgreSQL public.accommodations secara 1:1 bolak-balik tanpa kehilangan data', () => {
    const sample = {
      id: 'kos-test-supa',
      slug: 'kos-test-supa',
      campusId: 'itb',
      campusName: 'Institut Teknologi Bandung (Ganesha)',
      city: 'Bandung',
      area: 'Cisitu, Dago',
      name: 'Cisitu Sky Residence',
      address: 'Jl. Cisitu Indah No. 99, Bandung',
      lat: -6.8825,
      lng: 107.6112,
      priceMonthly: 1550000,
      price: 'Rp1.550.000 / bln',
      distance: '780m dari ITB',
      type: 'Putri',
      matchScore: 97,
      rating: 4.9,
      reviewsCount: 42,
      roomsAvailable: 3,
      visitingHours: 'Setiap hari • 09.00 – 20.00 WIB',
      verified: true,
      description: 'Kos nyaman dengan air hangat dan Wi-Fi cepat.',
      contact: {
        ownerName: 'Ibu Nita',
        phone: '+62 812-3456-7890',
        whatsapp: '6281234567890',
      },
      features: ['Water Heater', 'Kamar Mandi Dalam'],
      nearbyLandmarks: [{ name: 'Sabuga ITB', distance: '780 m' }],
      reviews: [{ author: 'Dina', rating: 5, comment: 'Sangat nyaman!' }],
      accentPalette: ['#0284c7', '#38bdf8'],
    };

    const pgRow = toSupabaseRow(sample);
    expect(pgRow.campus_id).toBe('itb');
    expect(pgRow.latitude).toBe(-6.8825);
    expect(pgRow.longitude).toBe(107.6112);
    expect(pgRow.price_monthly).toBe(1550000);
    expect(pgRow.owner_name).toBe('Ibu Nita');

    const restored = fromSupabaseRow(pgRow);
    expect(restored.id).toBe('kos-test-supa');
    expect(restored.lat).toBe(-6.8825);
    expect(restored.lng).toBe(107.6112);
    expect(restored.contact.phone).toBe('+62 812-3456-7890');
    expect(restored.features).toContain('Water Heater');
    expect(restored.reviews[0].author).toBe('Dina');
  });

  it('mengekstrak intent bahasa alami secara dinamis lintas kampus, tipe kos, budget, dan fasilitas', () => {
    const itbIntent = parseSmartKosIntent(
      'Carikan kos di sekitar ITB Dago yang ada water heater di bawah 1,7 juta',
    );
    expect(itbIntent.campusId).toBe('itb');
    expect(itbIntent.maxPrice).toBe(1700000);
    expect(itbIntent.keywordSignals).toContain('water heater');
    expect(itbIntent.keywordSignals).toContain('cisitu');

    const uiIntent = parseSmartKosIntent('Cari kos putri dekat stasiun KRL UI Depok');
    expect(uiIntent.campusId).toBe('ui');
    expect(uiIntent.kosType).toBe('putri');
    expect(uiIntent.keywordSignals).toContain('stasiun');
  });

  it('GET /api/accommodations memfilter data secara dinamis berdasarkan kampus, tipe, dan kata kunci', async () => {
    const allRes = await request(app).get('/api/accommodations');
    expect(allRes.status).toBe(200);
    expect(allRes.body.success).toBe(true);
    expect(allRes.body.count).toBeGreaterThanOrEqual(12);
    expect(allRes.body.campusHubs).toHaveProperty('telkom');
    expect(allRes.body.campusHubs).toHaveProperty('itb');

    const ugmRes = await request(app).get('/api/accommodations?query=kos+putri+tenang+dekat+sardjito+ugm');
    expect(ugmRes.status).toBe(200);
    expect(ugmRes.body.campusId).toBe('ugm');
    expect(ugmRes.body.primaryMatch.id).toBe('kos-ugm-2');
    expect(ugmRes.body.primaryMatch.name).toBe('Sendowo Quiet Scholar House');
  });

  it('POST /api/accommodations/ai-search/stream mengalirkan progres Thinking Orbs, redirect_location, rute, dan teks dinamis', async () => {
    const res = await request(app)
      .post('/api/accommodations/ai-search/stream')
      .send({
        message: 'Carikan kos di sekitar ITB Dago yang ada water heater',
        campusId: 'telkom',
        reasoningEffort: 'medium',
        stepDelayMs: 0,
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');

    const frames = parseSseFrames(res.text);
    const statusFrames = frames.filter((f) => f.event === 'status');
    expect(statusFrames.map((s) => s.data.step)).toEqual(
      expect.arrayContaining(['intent', 'database', 'routing', 'redirect']),
    );

    const redirectFrame = frames.find((f) => f.event === 'redirect_location');
    expect(redirectFrame).toBeDefined();
    expect(redirectFrame.data.campusId).toBe('itb');
    expect(redirectFrame.data.targetKos.id).toBe('kos-itb-1');
    expect(redirectFrame.data.targetKos.name).toBe('Cisitu Indah Smart Kost');
    expect(redirectFrame.data.route.distanceMeters).toBeGreaterThan(100);
    expect(Array.isArray(redirectFrame.data.route.geometry)).toBe(true);

    const doneFrame = frames.find((f) => f.event === 'done');
    expect(doneFrame).toBeDefined();
    expect(doneFrame.data.outputText).toContain('Cisitu Indah Smart Kost');
    expect(doneFrame.data.voiceSummary).toContain('Cisitu Indah Smart Kost');
  });

  it('POST /api/accommodations/ai-search/stream saat pengguna hanya menyapa (halo/hai) tidak mengarahkan kamera (tanpa redirect_location) dan langsung menyapa cepat', async () => {
    const res = await request(app)
      .post('/api/accommodations/ai-search/stream')
      .send({
        message: 'Halo',
        campusId: 'telkom',
        reasoningEffort: 'none',
        stepDelayMs: 0,
      });

    expect(res.status).toBe(200);
    const frames = parseSseFrames(res.text);

    // Pastikan TIDAK ADA event redirect_location dan TIDAK ADA event recommendations
    const redirectFrame = frames.find((f) => f.event === 'redirect_location');
    expect(redirectFrame).toBeUndefined();

    const recsFrame = frames.find((f) => f.event === 'recommendations');
    expect(recsFrame).toBeUndefined();

    // Sapaan pertama langsung cepat & to the point
    const textDeltaFrames = frames.filter((f) => f.event === 'text_delta');
    const combinedText = textDeltaFrames.map((f) => f.data.delta).join('');
    expect(combinedText).toBe('Halo! Ada yang bisa saya bantu?');

    const doneFrame = frames.find((f) => f.event === 'done');
    expect(doneFrame).toBeDefined();
    expect(doneFrame.data.outputText).toBe('Halo! Ada yang bisa saya bantu?');
    expect(doneFrame.data.isSearchIntent).toBe(false);
  });

  it('POST & GET /api/accommodations/bookings menyimpan dan mengembalikan jadwal survei kos secara dinamis', async () => {
    const postRes = await request(app).post('/api/accommodations/bookings').send({
      accommodationId: 'kos-4',
      accommodationName: 'PGA Executive Student Kost',
      campusName: 'Telkom University Bandung',
      scheduledLabel: 'Besok • 10:00 WIB',
      scheduledIso: '2026-11-08',
      visitorName: 'Andreas Wijaya',
    });

    expect(postRes.status).toBe(201);
    expect(postRes.body.success).toBe(true);
    expect(postRes.body.data.accommodationName).toBe('PGA Executive Student Kost');

    const listRes = await request(app).get('/api/accommodations/bookings');
    expect(listRes.status).toBe(200);
    expect(listRes.body.count).toBe(1);
    expect(listRes.body.data[0].visitorName).toBe('Andreas Wijaya');
  });
});
