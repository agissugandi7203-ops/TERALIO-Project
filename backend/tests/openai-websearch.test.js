import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { config } from '../config/env.js';
import { itemsService } from '../services/itemsService.js';
import { ItemModel } from '../models/itemModel.js';
import { _setOpenAiClientForTesting } from '../services/openaiService.js';
import { buildWebSearchToolConfig, extractWebSearchArtifacts } from '../services/webSearchService.js';

describe('OpenAI Responses API & Native Web Search Integration', () => {
  const originalApiKey = config.openai.apiKey;

  beforeEach(() => {
    itemsService._resetMemoryItems([
      new ItemModel({
        id: 'kos-harmoni-1',
        title: 'Kos Harmoni Bojongsoang',
        description: 'Kamar mandi dalam, WiFi cepat, 800m dari Telkom University, Rp 1.350.000/bulan',
        category: 'Kos Putra',
      }),
      new ItemModel({
        id: 'kos-asri-2',
        title: 'Kos Putri Asri Cisitu',
        description: 'Dekat ITB Bandung, AC, dapur bersama, Rp 1.800.000/bulan',
        category: 'Kos Putri',
      }),
    ]);
    _setOpenAiClientForTesting(null);
    config.openai.apiKey = originalApiKey;
  });

  afterEach(() => {
    _setOpenAiClientForTesting(null);
    config.openai.apiKey = originalApiKey;
  });

  it('GET /api/integrations/status mengembalikan kesiapan seluruh layanan tanpa membocorkan kunci', async () => {
    const res = await request(app).get('/api/integrations/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.openai.apiMode).toBe('responses');
    expect(res.body.data.openai.textModel).toBe('gpt-6-astra');
    expect(res.body.data.realtime.model).toBe('gpt-realtime-2.1');
    expect(res.body.data.mcp.endpoint).toBe('/api/mcp');
    expect(res.body.data.googleMaps.service).toBe('Google Maps Platform');
    expect(JSON.stringify(res.body)).not.toContain('sk-placeholder');
  });

  it('POST /api/openai/responses mengembalikan 503 transparan saat OPENAI_API_KEY belum dikonfigurasi', async () => {
    config.openai.apiKey = 'sk-placeholder-openai-key';
    const res = await request(app)
      .post('/api/openai/responses')
      .send({ input: 'Carikan kos dekat Telkom University' });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('OPENAI_NOT_CONFIGURED');
  });

  it('POST /api/openai/responses menjalankan agentic loop multi-round (function_call -> tool execution -> jawaban akhir)', async () => {
    config.openai.apiKey = 'sk-live-valid-test-key-1234567890';
    const createSpy = vi
      .fn()
      .mockResolvedValueOnce({
        id: 'resp_round_1',
        model: 'gpt-6-astra',
        status: 'completed',
        output_text: '',
        output: [
          {
            type: 'function_call',
            id: 'fc_1',
            call_id: 'call_kos_001',
            name: 'teralio_search_accommodations',
            arguments: JSON.stringify({ query: 'Telkom' }),
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'resp_round_2',
        model: 'gpt-6-astra',
        status: 'completed',
        output_text: 'Saya menemukan Kos Harmoni Bojongsoang dengan harga Rp 1.350.000/bulan, 800m dari Telkom University.',
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'output_text',
                text: 'Saya menemukan Kos Harmoni Bojongsoang dengan harga Rp 1.350.000/bulan, 800m dari Telkom University.',
                annotations: [],
              },
            ],
          },
        ],
        usage: { input_tokens: 210, output_tokens: 45, total_tokens: 255 },
      });

    _setOpenAiClientForTesting({ responses: { create: createSpy } });

    const res = await request(app).post('/api/openai/responses').send({
      input: 'Ada kos dekat Telkom University?',
      userContext: { campus: 'Telkom University', maxBudget: 1500000 },
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.responseId).toBe('resp_round_2');
    expect(res.body.data.outputText).toContain('Kos Harmoni Bojongsoang');
    expect(res.body.data.toolCalls).toHaveLength(1);
    expect(res.body.data.toolCalls[0]).toMatchObject({
      callId: 'call_kos_001',
      name: 'teralio_search_accommodations',
      ok: true,
      source: 'local',
    });

    // Pastikan putaran ke-2 mengirim previous_response_id dan hasil nyata dari itemsService
    expect(createSpy).toHaveBeenCalledTimes(2);
    const secondCallArgs = createSpy.mock.calls[1][0];
    expect(secondCallArgs.previous_response_id).toBe('resp_round_1');
    expect(secondCallArgs.input[0].type).toBe('function_call_output');
    expect(secondCallArgs.input[0].call_id).toBe('call_kos_001');
    expect(secondCallArgs.input[0].output).toContain('Kos Harmoni Bojongsoang');
  });

  it('POST /api/openai/web-search mengekstrak sitasi URL inline dan daftar sumber referensi secara terstruktur', async () => {
    config.openai.apiKey = 'sk-live-valid-test-key-1234567890';
    const createSpy = vi.fn().mockResolvedValue({
      id: 'resp_ws_1',
      model: 'gpt-6-astra',
      status: 'completed',
      output_text: 'Kereta Cepat Whoosh menghubungkan Jakarta dan Bandung hingga Stasiun Padalarang dan Tegalluar.',
      output: [
        {
          id: 'ws_01',
          type: 'web_search_call',
          status: 'completed',
          action: {
            type: 'search',
            queries: ['rute stasiun kereta cepat whoosh bandung terbaru'],
            sources: [
              { type: 'url', url: 'https://kcic.co.id/rute' },
              { type: 'url', url: 'https://bandung.go.id/transportasi' },
            ],
          },
        },
        {
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'output_text',
              text: 'Kereta Cepat Whoosh menghubungkan Jakarta dan Bandung hingga Stasiun Padalarang dan Tegalluar.',
              annotations: [
                {
                  type: 'url_citation',
                  title: 'KCIC Official Route',
                  url: 'https://kcic.co.id/rute',
                  start_index: 0,
                  end_index: 94,
                },
              ],
            },
          ],
        },
      ],
    });

    _setOpenAiClientForTesting({ responses: { create: createSpy } });

    const res = await request(app).post('/api/openai/web-search').send({
      query: 'Bagaimana akses transportasi Whoosh ke Bandung?',
      userLocation: { city: 'Bandung', country: 'ID' },
      allowedDomains: ['https://kcic.co.id/', 'bandung.go.id'],
      forceSearch: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.searched).toBe(true);
    expect(res.body.data.citations).toHaveLength(1);
    expect(res.body.data.citations[0]).toMatchObject({
      title: 'KCIC Official Route',
      url: 'https://kcic.co.id/rute',
    });
    expect(res.body.data.sources).toHaveLength(2);

    // Pastikan domain dinormalisasi tanpa skema https:// dan lokasi memiliki type: 'approximate'
    const sentTool = createSpy.mock.calls[0][0].tools[0];
    expect(sentTool).toMatchObject({
      type: 'web_search',
      user_location: { type: 'approximate', city: 'Bandung', country: 'ID' },
      filters: { allowed_domains: ['kcic.co.id', 'bandung.go.id'] },
    });
  });

  it('Unit helper buildWebSearchToolConfig & extractWebSearchArtifacts menangani respons tanpa pencarian web', () => {
    const tool = buildWebSearchToolConfig({ searchContextSize: 'high', externalWebAccess: false });
    expect(tool.search_context_size).toBe('high');
    expect(tool.external_web_access).toBe(false);

    const empty = extractWebSearchArtifacts({ output: [] });
    expect(empty.searched).toBe(false);
    expect(empty.citations).toEqual([]);
    expect(empty.sources).toEqual([]);
  });
});
