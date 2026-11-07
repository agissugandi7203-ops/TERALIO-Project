import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { config } from '../config/env.js';
import { ItemModel } from '../models/itemModel.js';
import { itemsService } from '../services/itemsService.js';
import { _setOpenAiClientForTesting } from '../services/openaiService.js';
import { extractVerifiedRecommendations } from '../services/recommendationExtractor.js';

function parseSseFrames(rawText) {
  return rawText
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      let event = 'message';
      let dataStr = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataStr += line.slice(5).trim();
        }
      }
      return {
        event,
        data: dataStr ? JSON.parse(dataStr) : null,
      };
    });
}

async function* createAsyncEventStream(events) {
  for (const ev of events) {
    yield ev;
  }
}

describe('Chat SSE Streaming, Attachments, & Verified Recommendations', () => {
  const originalApiKey = config.openai.apiKey;

  beforeEach(() => {
    itemsService._resetMemoryItems([
      new ItemModel({
        id: 'dev-boilerplate-1',
        title: 'Inisialisasi Project Express & Vite',
        description: 'Setup arsitektur terpisah antara backend dan frontend',
        category: 'Backend',
      }),
      new ItemModel({
        id: 'kos-dago-asri-1',
        title: 'Kos Putri Dago Asri',
        description: 'Kamar mandi dalam, WiFi 100Mbps, 600m dari ITB Ganesha, Rp 1.850.000/bulan',
        category: 'Kos Putri',
        address: 'Jl. Cisitu Indah No. 14, Dago, Bandung',
        location: { lat: -6.8812, lng: 107.6119 },
        contact: { phone: '+62 812-2000-1122' },
        features: ['WiFi', 'Kamar Mandi Dalam', 'Keamanan 24 Jam'],
      }),
    ]);
    _setOpenAiClientForTesting(null);
    config.openai.apiKey = originalApiKey;
  });

  afterEach(() => {
    _setOpenAiClientForTesting(null);
    config.openai.apiKey = originalApiKey;
  });

  describe('extractVerifiedRecommendations (Anti-Hallucination Gate)', () => {
    it('menggabungkan hasil maps_search_places + maps_get_place_details + maps_compute_route tanpa mengarang data', () => {
      const result = extractVerifiedRecommendations([
        {
          name: 'maps_search_places',
          args: { query: 'kos dekat ITB Bandung' },
          ok: true,
          data: {
            query: 'kos dekat ITB Bandung',
            places: [
              {
                id: 'ChIJ_dago_kos_01',
                name: 'Wisma Cisitu Residence',
                address: 'Jl. Cisitu Lama No. 8, Coblong, Kota Bandung',
                location: { lat: -6.8831, lng: 107.6098 },
                rating: 4.7,
                userRatingCount: 42,
                primaryTypeLabel: 'Boarding House',
                googleMapsUri: 'https://maps.google.com/?cid=1001',
              },
            ],
          },
        },
        {
          name: 'maps_get_place_details',
          args: { placeId: 'ChIJ_dago_kos_01' },
          ok: true,
          data: {
            place: {
              id: 'ChIJ_dago_kos_01',
              name: 'Wisma Cisitu Residence',
              address: 'Jl. Cisitu Lama No. 8, Coblong, Kota Bandung',
              location: { lat: -6.8831, lng: 107.6098 },
              description: 'Hunian tenang dekat kampus ITB',
              contact: {
                phone: '0811-2233-4455',
                website: null,
              },
              openingHours: { openNow: true, weekdayDescriptions: ['Senin: Buka 24 jam'] },
            },
          },
        },
        {
          name: 'maps_compute_route',
          args: {
            origin: { placeId: 'ChIJ_dago_kos_01' },
            destination: 'Institut Teknologi Bandung',
            travelMode: 'WALK',
          },
          ok: true,
          data: {
            travelMode: 'WALK',
            routes: [
              {
                distanceMeters: 850,
                distanceText: '0.85 km',
                durationText: '11 mnt',
              },
            ],
          },
        },
      ]);

      expect(result.hasValidRecommendations).toBe(true);
      expect(result.queryContext).toBe('kos dekat ITB Bandung');
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: 'gmaps:ChIJ_dago_kos_01',
        source: 'google_maps',
        name: 'Wisma Cisitu Residence',
        description: 'Hunian tenang dekat kampus ITB',
        address: 'Jl. Cisitu Lama No. 8, Coblong, Kota Bandung',
        price: null,
        contact: {
          phone: '0811-2233-4455',
          website: null,
        },
        rating: 4.7,
        openingStatus: 'Sedang buka',
        mapUrl: 'https://maps.google.com/?cid=1001',
        routeSummary: {
          distanceText: '0.85 km',
          durationText: '11 mnt',
          travelMode: 'WALK',
          targetLabel: 'Institut Teknologi Bandung',
        },
      });
    });

    it('menolak hasil tool yang gagal (ok: false) serta menyaring item boilerplate non-hunian', () => {
      const result = extractVerifiedRecommendations([
        {
          name: 'maps_search_places',
          args: { query: 'kos di Bandung' },
          ok: false,
          data: { places: [{ id: 'fake', name: 'Jangan Tampil', address: 'Jl. Palsu' }] },
        },
        {
          name: 'teralio_search_accommodations',
          args: { query: '' },
          ok: true,
          data: {
            accommodations: [
              {
                id: 'dev-1',
                title: 'Inisialisasi Project',
                description: 'Setup Express dan Vite',
                category: 'Frontend',
              },
              {
                id: 'dev-2',
                title: 'Item 1',
                description: 'Data uji umum',
                category: 'General',
              },
            ],
          },
        },
      ]);

      expect(result.hasValidRecommendations).toBe(false);
      expect(result.items).toEqual([]);
    });
  });

  describe('POST /api/openai/files (Attachment Upload)', () => {
    it('mengunggah gambar biner via OpenAI Files API saat client terkonfigurasi dan mengekstrak file teks .txt', async () => {
      config.openai.apiKey = 'sk-live-valid-test-key-1234567890';
      const filesCreateSpy = vi.fn().mockResolvedValue({ id: 'file-openai-img-99' });
      _setOpenAiClientForTesting({
        files: { create: filesCreateSpy },
        responses: { create: vi.fn() },
      });

      const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const imgRes = await request(app)
        .post('/api/openai/files')
        .set('Content-Type', 'image/png')
        .set('X-File-Name', encodeURIComponent('kamar-kos.png'))
        .set('X-File-Type', 'image/png')
        .send(fakePng);

      expect(imgRes.status).toBe(201);
      expect(imgRes.body.success).toBe(true);
      expect(imgRes.body.data).toMatchObject({
        id: 'file-openai-img-99',
        fileId: 'file-openai-img-99',
        mode: 'openai_file',
        kind: 'image',
        filename: 'kamar-kos.png',
        mimeType: 'image/png',
      });
      expect(filesCreateSpy).toHaveBeenCalledTimes(1);

      const txtBuffer = Buffer.from('Daftar kriteria kos: budget maks 2 juta, dekat ITB.', 'utf8');
      const txtRes = await request(app)
        .post('/api/openai/files')
        .set('Content-Type', 'text/plain')
        .set('X-File-Name', 'kriteria-kos.txt')
        .set('X-File-Type', 'text/plain')
        .send(txtBuffer);

      expect(txtRes.status).toBe(201);
      expect(txtRes.body.data).toMatchObject({
        mode: 'extracted_text',
        kind: 'text_file',
        filename: 'kriteria-kos.txt',
      });
      expect(txtRes.body.data.extractedText).toContain('budget maks 2 juta');
    });

    it('menolak ekstensi file yang tidak didukung dengan status 400', async () => {
      const badRes = await request(app)
        .post('/api/openai/files')
        .set('Content-Type', 'application/octet-stream')
        .set('X-File-Name', 'installer.exe')
        .send(Buffer.from('MZ-binary-payload'));

      expect(badRes.status).toBe(400);
      expect(badRes.body.success).toBe(false);
    });
  });

  describe('POST /api/openai/responses/stream (SSE Progressive Streaming)', () => {
    it('mengembalikan 503 OPENAI_NOT_CONFIGURED sebelum membuka SSE jika kunci API masih placeholder', async () => {
      config.openai.apiKey = 'sk-placeholder-openai-key';
      const res = await request(app)
        .post('/api/openai/responses/stream')
        .send({ message: 'Halo TERALIO' });

      expect(res.status).toBe(503);
      expect(res.body.code).toBe('OPENAI_NOT_CONFIGURED');
    });

    it('mengalirkan event SSE multi-round (status -> tool_start -> tool_end -> recommendations -> text_delta -> done)', async () => {
      config.openai.apiKey = 'sk-live-valid-test-key-1234567890';

      const round1Events = [
        {
          type: 'response.output_item.added',
          item: {
            type: 'function_call',
            id: 'fc_item_1',
            call_id: 'call_dago_1',
            name: 'teralio_search_accommodations',
          },
        },
        {
          type: 'response.completed',
          response: {
            id: 'resp_stream_r1',
            model: 'gpt-6-astra',
            status: 'completed',
            output_text: '',
            output: [
              {
                type: 'function_call',
                id: 'fc_item_1',
                call_id: 'call_dago_1',
                name: 'teralio_search_accommodations',
                arguments: JSON.stringify({ query: 'Dago' }),
              },
            ],
          },
        },
      ];

      const round2Events = [
        {
          type: 'response.reasoning_summary_part.added',
        },
        {
          type: 'response.output_text.delta',
          item_id: 'msg_2',
          delta: 'Berikut rekomendasi kos di Dago: ',
        },
        {
          type: 'response.output_text.delta',
          item_id: 'msg_2',
          delta: '**Kos Putri Dago Asri** (Rp 1.850.000/bulan).',
        },
        {
          type: 'response.completed',
          response: {
            id: 'resp_stream_r2',
            model: 'gpt-6-astra',
            status: 'completed',
            output_text: 'Berikut rekomendasi kos di Dago: **Kos Putri Dago Asri** (Rp 1.850.000/bulan).',
            output: [],
            usage: { input_tokens: 180, output_tokens: 32, total_tokens: 212 },
          },
        },
      ];

      const createSpy = vi
        .fn()
        .mockImplementationOnce(async () => createAsyncEventStream(round1Events))
        .mockImplementationOnce(async () => createAsyncEventStream(round2Events));

      _setOpenAiClientForTesting({ responses: { create: createSpy } });

      const res = await request(app)
        .post('/api/openai/responses/stream')
        .send({
          message: 'Carikan kos putri di sekitar Dago Bandung',
          reasoningEffort: 'high',
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');

      const frames = parseSseFrames(res.text);
      const eventNames = frames.map((f) => f.event);

      expect(eventNames).toContain('status');
      expect(eventNames).toContain('tool_start');
      expect(eventNames).toContain('tool_end');
      expect(eventNames).toContain('recommendations');
      expect(eventNames).toContain('text_delta');
      expect(eventNames.at(-1)).toBe('done');

      // Pastikan Thinking On meneruskan reasoning.effort = 'high' dan Orb variant 'twins'
      expect(createSpy.mock.calls[0][0].reasoning).toEqual({ effort: 'high' });
      const firstStatus = frames.find((f) => f.event === 'status');
      expect(firstStatus.data).toMatchObject({ orbState: 'reasoning', variant: 'twins' });

      // Pastikan rekomendasi hanya memuat Kos Putri Dago Asri (item boilerplate disaring)
      const recFrame = frames.find((f) => f.event === 'recommendations');
      expect(recFrame.data.hasValidRecommendations).toBe(true);
      expect(recFrame.data.items).toHaveLength(1);
      expect(recFrame.data.items[0].name).toBe('Kos Putri Dago Asri');
      expect(recFrame.data.items[0].contact.phone).toBe('+62 812-2000-1122');

      const doneFrame = frames.find((f) => f.event === 'done');
      expect(doneFrame.data.responseId).toBe('resp_stream_r2');
      expect(doneFrame.data.outputText).toBe(
        'Berikut rekomendasi kos di Dago: **Kos Putri Dago Asri** (Rp 1.850.000/bulan).',
      );
    });

    it('mendukung pengiriman lampiran tanpa teks (message kosong + attachments)', async () => {
      config.openai.apiKey = 'sk-live-valid-test-key-1234567890';
      const createSpy = vi.fn().mockImplementation(async () =>
        createAsyncEventStream([
          { type: 'response.output_text.delta', delta: 'Gambar kamar kos terlihat bersih dan terang.' },
          {
            type: 'response.completed',
            response: {
              id: 'resp_att_1',
              model: 'gpt-6-astra',
              status: 'completed',
              output_text: 'Gambar kamar kos terlihat bersih dan terang.',
              output: [],
            },
          },
        ]),
      );

      _setOpenAiClientForTesting({ responses: { create: createSpy } });

      const res = await request(app)
        .post('/api/openai/responses/stream')
        .send({
          message: '',
          attachments: [
            {
              kind: 'image',
              fileId: 'file-openai-img-99',
              filename: 'foto-kamar.png',
              mimeType: 'image/png',
            },
          ],
        });

      expect(res.status).toBe(200);
      const sentInput = createSpy.mock.calls[0][0].input;
      expect(Array.isArray(sentInput)).toBe(true);
      expect(sentInput[0].content[0]).toMatchObject({
        type: 'input_image',
        file_id: 'file-openai-img-99',
      });
    });
  });

  describe('POST /api/realtime/tool-call (Voice Recommendation Relay)', () => {
    it('mengembalikan recommendations tervalidasi saat voice session memanggil tool pencarian hunian', async () => {
      const res = await request(app)
        .post('/api/realtime/tool-call')
        .send({
          callId: 'call_voice_kos_1',
          name: 'teralio_search_accommodations',
          arguments: { query: 'Dago' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ok).toBe(true);
      expect(res.body.data.recommendations.hasValidRecommendations).toBe(true);
      expect(res.body.data.recommendations.items).toHaveLength(1);
      expect(res.body.data.recommendations.items[0].name).toBe('Kos Putri Dago Asri');
      expect(res.body.data.clientEvents).toHaveLength(2);
    });
  });
});
