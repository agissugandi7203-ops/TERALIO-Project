import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import app from '../app.js';
import { config } from '../config/env.js';
import { itemsService } from '../services/itemsService.js';
import { ItemModel } from '../models/itemModel.js';
import { mcpClientService } from '../services/mcpClientService.js';
import { _setOpenAiClientForTesting } from '../services/openaiService.js';

describe('Model Context Protocol (MCP) Streamable HTTP Server, Client & Tool Orchestrator', () => {
  let server;
  let baseUrl;
  const originalAuthToken = config.mcp.serverAuthToken;
  const originalOpenAiKey = config.openai.apiKey;

  beforeAll(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    config.mcp.serverAuthToken = originalAuthToken;
    config.openai.apiKey = originalOpenAiKey;
    mcpClientService._setExternalServersForTesting(null);
    _setOpenAiClientForTesting(null);
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    config.mcp.serverAuthToken = '';
    config.openai.apiKey = originalOpenAiKey;
    mcpClientService._setExternalServersForTesting(null);
    _setOpenAiClientForTesting(null);
    itemsService._resetMemoryItems([
      new ItemModel({
        id: 'kos-mcp-1',
        title: 'Kos Melati Dipatiukur',
        description: '5 menit jalan kaki ke UNPAD Dipatiukur, kamar mandi dalam, Rp 1.400.000',
        category: 'Kos Putri',
      }),
    ]);
  });

  it('MCP Client resmi dapat terhubung ke /api/mcp (initialize, tools/list, tools/call) via Streamable HTTP', async () => {
    const client = new Client({ name: 'vitest-mcp-inspector', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/api/mcp`));

    await client.connect(transport);
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);

    expect(names).toContain('teralio_search_accommodations');
    expect(names).toContain('teralio_get_accommodation_details');
    expect(names).toContain('maps_search_places');
    expect(names).toContain('maps_get_place_details');
    expect(names).toContain('maps_geocode');
    expect(names).toContain('maps_compute_route');
    expect(names).toContain('teralio_web_search');

    const callResult = await client.callTool({
      name: 'teralio_search_accommodations',
      arguments: { query: 'Dipatiukur' },
    });

    expect(callResult.isError).toBeFalsy();
    const parsed = JSON.parse(callResult.content[0].text);
    expect(parsed.returnedCount).toBe(1);
    expect(parsed.accommodations[0].title).toBe('Kos Melati Dipatiukur');

    await transport.close();
  });

  it('GET /api/mcp mengembalikan 405 Method Not Allowed sesuai spesifikasi stateless Streamable HTTP', async () => {
    const res = await request(app).get('/api/mcp');
    expect(res.status).toBe(405);
    expect(res.headers.allow).toBe('POST');
  });

  it('MCP Bearer authentication menolak token salah (401) dan mengizinkan token valid (200)', async () => {
    config.mcp.serverAuthToken = 'mcp-secret-token-xyz-999';

    const unauthRes = await request(app)
      .post('/api/mcp')
      .send({ jsonrpc: '2.0', id: 1, method: 'ping' });
    expect(unauthRes.status).toBe(401);

    const client = new Client({ name: 'authed-mcp-client', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/api/mcp`), {
      requestInit: {
        headers: { Authorization: 'Bearer mcp-secret-token-xyz-999' },
      },
    });

    await client.connect(transport);
    const { tools } = await client.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(7);
    await transport.close();
  });

  it('mcpClientService + toolOrchestrator menemukan & memanggil external MCP server di dalam percakapan AI', async () => {
    config.mcp.serverAuthToken = 'loopback-secret';
    config.openai.apiKey = 'sk-live-valid-test-key-1234567890';

    // Hubungkan mcpClientService ke server MCP nyata sebagai external server (`campus_hub`)
    mcpClientService._setExternalServersForTesting([
      {
        label: 'campus_hub',
        url: `${baseUrl}/api/mcp`,
        execution: 'backend',
        authToken: 'loopback-secret',
        allowedTools: ['teralio_get_accommodation_details'],
      },
      {
        label: 'public_connector',
        url: 'https://mcp.example.org/sse',
        execution: 'openai_remote',
        authToken: 'remote-secret-not-leaked',
        requireApproval: 'never',
      },
    ]);

    // 1. Verifikasi penemuan tools & proteksi kebocoran token pada /api/mcp/tools dan /api/mcp/status
    const catalogRes = await request(app).get('/api/mcp/tools');
    expect(catalogRes.status).toBe(200);
    expect(catalogRes.body.data.externalBackendMcpCount).toBe(1);
    expect(catalogRes.body.data.openAiRemoteMcpCount).toBe(1);
    expect(JSON.stringify(catalogRes.body)).not.toContain('remote-secret-not-leaked');
    expect(JSON.stringify(catalogRes.body)).not.toContain('loopback-secret');

    const statusRes = await request(app).get('/api/mcp/status?probe=true');
    expect(statusRes.status).toBe(200);
    const hubStatus = statusRes.body.data.externalServers.find((s) => s.label === 'campus_hub');
    expect(hubStatus.reachable).toBe(true);
    expect(hubStatus.toolCount).toBeGreaterThanOrEqual(1);

    // 2. Verifikasi model AI memanggil external MCP tool `mcp__campus_hub__teralio_get_accommodation_details`
    const createSpy = vi
      .fn()
      .mockResolvedValueOnce({
        id: 'resp_mcp_1',
        model: 'gpt-6-astra',
        status: 'completed',
        output_text: '',
        output: [
          {
            type: 'function_call',
            id: 'fc_mcp_1',
            call_id: 'call_mcp_01',
            name: 'mcp__campus_hub__teralio_get_accommodation_details',
            arguments: JSON.stringify({ id: 'kos-mcp-1' }),
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'resp_mcp_2',
        model: 'gpt-6-astra',
        status: 'completed',
        output_text: 'Detail dari MCP: Kos Melati Dipatiukur seharga Rp 1.400.000.',
        output: [],
      });

    _setOpenAiClientForTesting({ responses: { create: createSpy } });

    const aiRes = await request(app).post('/api/openai/responses').send({
      input: 'Lihat detail kos-mcp-1 melalui MCP campus_hub',
    });

    expect(aiRes.status).toBe(200);
    expect(aiRes.body.data.toolCalls[0]).toMatchObject({
      name: 'mcp__campus_hub__teralio_get_accommodation_details',
      ok: true,
      source: 'mcp:campus_hub',
    });
    expect(aiRes.body.data.outputText).toContain('Kos Melati Dipatiukur');
  });
});
