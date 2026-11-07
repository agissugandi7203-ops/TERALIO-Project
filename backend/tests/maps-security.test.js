import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { config } from '../config/env.js';
import { redact } from '../utils/logger.js';

describe('Google Maps Platform Service & Backend Security Validation', () => {
  const originalMapsKey = config.googleMaps.serverApiKey;
  const originalAiRequireAuth = config.security.aiRequireAuth;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    config.googleMaps.serverApiKey = originalMapsKey;
    config.security.aiRequireAuth = false;
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    config.googleMaps.serverApiKey = originalMapsKey;
    config.security.aiRequireAuth = originalAiRequireAuth;
    globalThis.fetch = originalFetch;
  });

  it('Mengembalikan 503 GOOGLE_MAPS_NOT_CONFIGURED secara transparan saat kunci belum dikonfigurasi', async () => {
    config.googleMaps.serverApiKey = 'your-google-maps-server-api-key';
    const res = await request(app).post('/api/maps/places/search').send({ query: 'Telkom University' });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('GOOGLE_MAPS_NOT_CONFIGURED');
  });

  it('Places Text Search mengirim header X-Goog-FieldMask tepat & menormalisasi hasil tempat', async () => {
    config.googleMaps.serverApiKey = 'AIzaSyTestValidMapsServerKey123456789';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          places: [
            {
              id: 'ChIJ_telkom_univ',
              displayName: { text: 'Telkom University' },
              primaryType: 'university',
              primaryTypeDisplayName: { text: 'Universitas' },
              formattedAddress: 'Jl. Telekomunikasi No.1, Bandung, Jawa Barat',
              location: { latitude: -6.9732, longitude: 107.6303 },
              googleMapsUri: 'https://maps.google.com/?cid=123',
              businessStatus: 'OPERATIONAL',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    globalThis.fetch = fetchMock;

    const res = await request(app)
      .get('/api/maps/places/search')
      .query({ query: 'Telkom University', lat: -6.97, lng: 107.63, radiusMeters: 2000 });

    expect(res.status).toBe(200);
    expect(res.body.data.sku).toBe('Text Search Pro');
    expect(res.body.data.places[0]).toMatchObject({
      id: 'ChIJ_telkom_univ',
      name: 'Telkom University',
      address: 'Jl. Telekomunikasi No.1, Bandung, Jawa Barat',
      location: { lat: -6.9732, lng: 107.6303 },
    });

    const [calledUrl, calledInit] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe('https://places.googleapis.com/v1/places:searchText');
    expect(calledInit.headers['X-Goog-FieldMask']).toContain('places.displayName');
    expect(calledInit.headers['X-Goog-FieldMask']).not.toContain('reviews');
  });

  it('Place Details memilih SKU sesuai parameter level (basic -> Pro, contact -> Enterprise, full -> Atmosphere)', async () => {
    config.googleMaps.serverApiKey = 'AIzaSyTestValidMapsServerKey123456789';
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(
        JSON.stringify({
          id: 'ChIJ_kos_01',
          displayName: { text: 'Pondok Mahasiswa Sukapura' },
          formattedAddress: 'Sukapura, Dayeuhkolot, Bandung',
          location: { latitude: -6.971, longitude: 107.632 },
          nationalPhoneNumber: '0812-0000-1111',
          websiteUri: 'https://example.com',
          rating: 4.7,
          userRatingCount: 38,
          editorialSummary: { text: 'Hunian mahasiswa dekat gerbang kampus.' },
          regularOpeningHours: { openNow: true, weekdayDescriptions: ['Senin: Buka 24 jam'] },
        }),
        { status: 200 },
      ),
    );
    globalThis.fetch = fetchMock;

    const basicRes = await request(app).get('/api/maps/places/ChIJ_kos_01?level=basic');
    expect(basicRes.status).toBe(200);
    expect(basicRes.body.data.sku).toBe('Place Details Pro');
    expect(fetchMock.mock.calls[0][1].headers['X-Goog-FieldMask']).not.toContain('nationalPhoneNumber');

    const fullRes = await request(app).get('/api/maps/places/ChIJ_kos_01?level=full');
    expect(fullRes.status).toBe(200);
    expect(fullRes.body.data.sku).toBe('Place Details Enterprise + Atmosphere');
    expect(fullRes.body.data.place.description).toBe('Hunian mahasiswa dekat gerbang kampus.');
    expect(fullRes.body.data.place.contact.phone).toBe('0812-0000-1111');
  });

  it('Geocoding mendeteksi billing belum aktif pada project GCP dan mengembalikan 402 GOOGLE_MAPS_BILLING_REQUIRED', async () => {
    config.googleMaps.serverApiKey = 'AIzaSyTestValidMapsServerKey123456789';
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'REQUEST_DENIED',
          error_message: 'You must enable Billing on the Google Cloud Project at https://console.cloud.google.com',
          results: [],
        }),
        { status: 200 },
      ),
    );

    const res = await request(app).post('/api/maps/geocode').send({ address: 'Jl. Ganesha 10 Bandung' });
    expect(res.status).toBe(402);
    expect(res.body.code).toBe('GOOGLE_MAPS_BILLING_REQUIRED');
    expect(res.body.message).toContain('billing account aktif');
  });

  it('Routes API menghitung jarak & durasi serta membedakan TRAFFIC_UNAWARE (Essentials) vs WALK', async () => {
    config.googleMaps.serverApiKey = 'AIzaSyTestValidMapsServerKey123456789';
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(
        JSON.stringify({
          routes: [
            {
              distanceMeters: 850,
              duration: '612s',
              staticDuration: '612s',
              localizedValues: {
                distance: { text: '0,9 km' },
                duration: { text: '10 mnt' },
              },
              polyline: { encodedPolyline: 'abcd1234' },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    globalThis.fetch = fetchMock;

    const walkRes = await request(app).post('/api/maps/routes').send({
      origin: { lat: -6.971, lng: 107.632 },
      destination: 'Telkom University Bandung',
      travelMode: 'WALK',
    });

    expect(walkRes.status).toBe(200);
    expect(walkRes.body.data.sku).toBe('Compute Routes Essentials');
    expect(walkRes.body.data.routes[0]).toMatchObject({
      distanceMeters: 850,
      durationSeconds: 612,
      distanceText: '0,9 km',
      durationText: '10 mnt',
    });
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.routingPreference).toBeUndefined();
  });

  it('Keamanan: redaksi rahasia, header keamanan, JSON rusak, dan AI_REQUIRE_AUTH berjalan ketat', async () => {
    // 1. Redaksi berbagai pola token sensitif
    const dirty =
      'Key1=sk-proj-AbCdEf1234567890 secret=ek_live9876543210 gkey=AIzaSyD12345678901234567890123 url=https://x.com?key=SECRET99 auth=Bearer mySuperSecretToken123';
    const cleaned = redact(dirty);
    expect(cleaned).not.toContain('sk-proj-AbCdEf1234567890');
    expect(cleaned).not.toContain('ek_live9876543210');
    expect(cleaned).not.toContain('AIzaSyD12345678901234567890123');
    expect(cleaned).not.toContain('SECRET99');
    expect(cleaned).not.toContain('mySuperSecretToken123');
    expect(cleaned).toContain('[REDACTED]');

    // 2. Security headers & penanganan JSON rusak
    const badJsonRes = await request(app)
      .post('/api/openai/responses')
      .set('Content-Type', 'application/json')
      .send('{"input": "broken');
    expect(badJsonRes.status).toBe(400);
    expect(badJsonRes.body.code).toBe('INVALID_JSON');
    expect(badJsonRes.headers['x-content-type-options']).toBe('nosniff');
    expect(badJsonRes.headers['x-frame-options']).toBe('DENY');

    // 3. Penegakan AI_REQUIRE_AUTH=true
    config.security.aiRequireAuth = true;
    const blockedRes = await request(app)
      .post('/api/openai/responses')
      .send({ input: 'Tes tanpa token' });
    expect(blockedRes.status).toBe(401);
    expect(blockedRes.body.code).toBe('AUTH_REQUIRED');
  });
});
