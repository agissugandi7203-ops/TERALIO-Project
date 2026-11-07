import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { config } from '../config/env.js';
import { itemsService } from '../services/itemsService.js';
import { ItemModel } from '../models/itemModel.js';
import { _setOpenAiClientForTesting } from '../services/openaiService.js';

const SAMPLE_SDP_OFFER = [
  'v=0',
  'o=- 4611731400430051336 2 IN IP4 127.0.0.1',
  's=-',
  't=0 0',
  'm=audio 9 UDP/TLS/RTP/SAVPF 111',
  'a=mid:0',
  'a=sendrecv',
  '',
].join('\r\n');

const SAMPLE_SDP_ANSWER = [
  'v=0',
  'o=- 999999 2 IN IP4 127.0.0.1',
  's=OpenAI Realtime',
  't=0 0',
  'm=audio 9 UDP/TLS/RTP/SAVPF 111',
  'a=accept',
  '',
].join('\r\n');

describe('OpenAI Realtime Voice (gpt-realtime-2.1) & WebRTC Integration', () => {
  const originalApiKey = config.openai.apiKey;

  beforeEach(() => {
    itemsService._resetMemoryItems([
      new ItemModel({
        id: 'kos-10',
        title: 'Kos Cendekia Dayeuhkolot',
        description: 'Dekat kampus, tenang untuk belajar, Rp 1.200.000/bulan',
        category: 'Kos Campur',
      }),
    ]);
    _setOpenAiClientForTesting(null);
    config.openai.apiKey = originalApiKey;
  });

  afterEach(() => {
    _setOpenAiClientForTesting(null);
    config.openai.apiKey = originalApiKey;
  });

  it('POST /api/realtime/config membangun konfigurasi sesi GA Realtime yang valid (output_modalities tunggal & semantic_vad)', async () => {
    const res = await request(app).post('/api/realtime/config').send({
      voice: 'cedar',
      vadEagerness: 'medium',
      userContext: { campus: 'ITB' },
    });

    expect(res.status).toBe(200);
    const { session } = res.body.data;
    expect(session.type).toBe('realtime');
    expect(session.model).toBe('gpt-realtime-2.1');
    // Aturan GA: hanya ['audio'] (sudah memuat audio + transkrip), tidak boleh ['audio', 'text']
    expect(session.output_modalities).toEqual(['audio']);
    expect(session.audio.output.voice).toBe('cedar');
    expect(session.audio.input.transcription.model).toBe('gpt-transcribe');
    expect(session.audio.input.turn_detection).toMatchObject({
      type: 'semantic_vad',
      eagerness: 'medium',
      create_response: true,
      interrupt_response: true,
    });
    expect(session.reasoning).toEqual({ effort: 'low' });
    const toolNames = session.tools.map((t) => t.name);
    expect(toolNames).toContain('teralio_search_accommodations');
    expect(toolNames).toContain('maps_search_places');
    expect(toolNames).toContain('teralio_web_search');
  });

  it('POST /api/realtime/config menolak model Realtime yang sudah deprecated', async () => {
    const res = await request(app).post('/api/realtime/config').send({
      model: 'gpt-4o-realtime-preview',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
    expect(res.body.message).toContain('deprecated');
  });

  it('POST /api/realtime/client-secrets menerbitkan ephemeral token dengan header Cache-Control: no-store', async () => {
    config.openai.apiKey = 'sk-live-valid-test-key-1234567890';
    const createSecretSpy = vi.fn().mockResolvedValue({
      value: 'ek_ephemeral_session_secret_987654',
      expires_at: 1790000600,
      session: {
        id: 'sess_realtime_01',
        object: 'realtime.session',
        type: 'realtime',
        model: 'gpt-realtime-2.1',
      },
    });

    _setOpenAiClientForTesting({
      realtime: {
        clientSecrets: { create: createSecretSpy },
      },
    });

    const res = await request(app).post('/api/realtime/client-secrets').send({
      voice: 'marin',
      ttlSeconds: 300,
    });

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('no-store');
    expect(res.body.data.clientSecret).toEqual({
      value: 'ek_ephemeral_session_secret_987654',
      expiresAt: 1790000600,
      ttlSeconds: 300,
    });
    expect(res.body.data.webrtc).toMatchObject({
      callsUrl: 'https://api.openai.com/v1/realtime/calls',
      dataChannelLabel: 'oai-events',
      toolRelayEndpoint: '/api/realtime/tool-call',
    });
    expect(JSON.stringify(res.body)).not.toContain(config.openai.apiKey);

    expect(createSecretSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        expires_after: { anchor: 'created_at', seconds: 300 },
      }),
    );
  });

  it('POST /api/realtime/calls mendukung pertukaran SDP offer/answer (raw application/sdp & JSON) + ekstraksi callId', async () => {
    config.openai.apiKey = 'sk-live-valid-test-key-1234567890';
    const createCallSpy = vi.fn().mockImplementation(async () => {
      return new Response(SAMPLE_SDP_ANSWER, {
        status: 201,
        headers: {
          'Content-Type': 'application/sdp',
          Location: 'https://api.openai.com/v1/realtime/calls/call_teralio_abc123',
        },
      });
    });
    const hangupSpy = vi.fn().mockResolvedValue(undefined);

    _setOpenAiClientForTesting({
      realtime: {
        calls: { create: createCallSpy, hangup: hangupSpy },
      },
    });

    // 1. Mode raw application/sdp (standar WebRTC client)
    const rawRes = await request(app)
      .post('/api/realtime/calls?voice=marin')
      .set('Content-Type', 'application/sdp')
      .set('Accept', 'application/sdp')
      .send(SAMPLE_SDP_OFFER);

    expect(rawRes.status).toBe(201);
    expect(rawRes.headers['content-type']).toContain('application/sdp');
    expect(rawRes.headers['x-realtime-call-id']).toBe('call_teralio_abc123');
    expect(rawRes.text).toContain('s=OpenAI Realtime');

    // 2. Mode JSON
    const jsonRes = await request(app)
      .post('/api/realtime/calls')
      .set('Accept', 'application/json')
      .send({ sdp: SAMPLE_SDP_OFFER, voice: 'cedar' });

    expect(jsonRes.status).toBe(201);
    expect(jsonRes.body.data.callId).toBe('call_teralio_abc123');
    expect(jsonRes.body.data.sdpAnswer).toContain('v=0');

    // 3. Hangup call
    const hangupRes = await request(app).post('/api/realtime/calls/call_teralio_abc123/hangup');
    expect(hangupRes.status).toBe(200);
    expect(hangupRes.body.data).toEqual({ callId: 'call_teralio_abc123', hungUp: true });
    expect(hangupSpy).toHaveBeenCalledWith('call_teralio_abc123');
  });

  it('POST /api/realtime/calls menolak SDP offer yang tidak valid', async () => {
    const res = await request(app).post('/api/realtime/calls').send({ sdp: 'invalid-sdp' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('POST /api/realtime/tool-call mengeksekusi tool di backend dan mengembalikan paket event DataChannel Realtime', async () => {
    const res = await request(app).post('/api/realtime/tool-call').send({
      callId: 'call_fn_42',
      name: 'teralio_search_accommodations',
      arguments: JSON.stringify({ query: 'Cendekia' }),
    });

    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
    expect(res.body.data.result.returnedCount).toBe(1);
    expect(res.body.data.clientEvents).toHaveLength(2);
    expect(res.body.data.clientEvents[0]).toMatchObject({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: 'call_fn_42',
      },
    });
    expect(res.body.data.clientEvents[1]).toEqual({ type: 'response.create' });
  });
});
