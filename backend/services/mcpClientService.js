import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { config } from '../config/env.js';
import { AppError, badRequest, timeoutError, upstreamError } from '../utils/errors.js';
import { withTimeout } from '../utils/http.js';
import { createLogger } from '../utils/logger.js';

/**
 * MCP Client Manager untuk menghubungkan TERALIO ke server Model Context Protocol eksternal.
 *
 * Mendukung dua mode integrasi sesuai dokumentasi resmi OpenAI & MCP:
 *  1. `execution: "backend"` (default): Backend bertindak sebagai MCP Client melalui
 *     `StreamableHTTPClientTransport`, menemukan daftar tools (`tools/list`), meneruskannya
 *     sebagai function tools ke OpenAI, mengeksekusi `tools/call`, dan mengembalikan hasilnya ke model.
 *  2. `execution: "openai_remote"`: Server MCP publik (HTTPS) diserahkan langsung sebagai
 *     native tool `{ type: "mcp", server_label, server_url, ... }` ke OpenAI Responses API / Realtime API.
 */
const log = createLogger('McpClient');

const CACHE_TTL_MS = 60_000;
const sanitizeLabel = (label) => String(label || '').trim().replace(/[^A-Za-z0-9_-]/g, '_');

let runtimeServers = null;
const toolCache = new Map();

const normalizeServerEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return null;
  const label = sanitizeLabel(entry.label || entry.server_label);
  const url = typeof entry.url === 'string' ? entry.url.trim() : typeof entry.server_url === 'string' ? entry.server_url.trim() : '';
  if (!label || !url) return null;

  return {
    label,
    url,
    execution: entry.execution === 'openai_remote' ? 'openai_remote' : 'backend',
    authToken: typeof entry.authToken === 'string' ? entry.authToken.trim() : '',
    headers: entry.headers && typeof entry.headers === 'object' ? entry.headers : {},
    allowedTools: Array.isArray(entry.allowedTools) ? entry.allowedTools.map(String) : null,
    requireApproval: entry.requireApproval || 'never',
    enabled: entry.enabled !== false,
  };
};

const getConfiguredServers = () => {
  const raw = runtimeServers ?? config.mcp.externalServers;
  return raw.map(normalizeServerEntry).filter((s) => s && s.enabled);
};

async function withMcpClient(server, fn) {
  let parsedUrl;
  try {
    parsedUrl = new URL(server.url);
  } catch {
    throw badRequest(`URL MCP server '${server.label}' tidak valid`);
  }

  const headers = { ...server.headers };
  if (server.authToken && !headers.Authorization && !headers.authorization) {
    headers.Authorization = server.authToken.startsWith('Bearer ')
      ? server.authToken
      : `Bearer ${server.authToken}`;
  }

  const client = new Client({ name: 'teralio-backend-mcp-client', version: '1.0.0' }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(parsedUrl, {
    requestInit: Object.keys(headers).length > 0 ? { headers } : undefined,
  });

  try {
    await withTimeout(
      client.connect(transport),
      config.mcp.toolTimeoutMs,
      () => timeoutError('MCP', `Koneksi ke MCP server '${server.label}' melewati batas waktu`),
    );
    return await withTimeout(
      fn(client),
      config.mcp.toolTimeoutMs,
      () => timeoutError('MCP', `Operasi pada MCP server '${server.label}' melewati batas waktu`),
    );
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw upstreamError('MCP', `Gagal berkomunikasi dengan MCP server '${server.label}': ${err?.message || 'unknown error'}`);
  } finally {
    try {
      await transport.close();
    } catch {
      // Abaikan error penutupan transport stateless
    }
  }
}

const parseMcpToolContent = (result) => {
  if (result?.structuredContent !== undefined) return result.structuredContent;
  const content = Array.isArray(result?.content) ? result.content : [];
  const texts = content
    .filter((item) => item?.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text);
  if (texts.length === 1) {
    try {
      return JSON.parse(texts[0]);
    } catch {
      return texts[0];
    }
  }
  return texts.length > 0 ? texts.join('\n') : content;
};

export const mcpClientService = {
  /** Mengembalikan definisi `{ type: 'mcp', ... }` untuk server yang didelegasikan langsung ke OpenAI. */
  getOpenAiRemoteMcpTools() {
    return getConfiguredServers()
      .filter((s) => s.execution === 'openai_remote')
      .map((s) => ({
        type: 'mcp',
        server_label: s.label,
        server_url: s.url,
        require_approval: s.requireApproval,
        ...(s.authToken ? { authorization: s.authToken.replace(/^Bearer\s+/i, '') } : {}),
        ...(s.allowedTools && s.allowedTools.length > 0 ? { allowed_tools: s.allowedTools } : {}),
      }));
  },

  /** Menemukan daftar tools dari seluruh MCP server eksternal bermode `backend`. */
  async discoverBackendTools({ forceRefresh = false } = {}) {
    const servers = getConfiguredServers().filter((s) => s.execution === 'backend');
    const discovered = [];

    for (const server of servers) {
      const cached = toolCache.get(server.label);
      if (!forceRefresh && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        discovered.push(...cached.tools);
        continue;
      }

      try {
        const listResult = await withMcpClient(server, (client) => client.listTools());
        const rawTools = Array.isArray(listResult?.tools) ? listResult.tools : [];
        const filtered = server.allowedTools
          ? rawTools.filter((t) => server.allowedTools.includes(t.name))
          : rawTools;

        const mapped = filtered.map((tool) => ({
          qualifiedName: `mcp__${server.label}__${tool.name}`,
          serverLabel: server.label,
          remoteName: tool.name,
          description: tool.description || `Tool '${tool.name}' dari MCP server '${server.label}'`,
          inputSchema: tool.inputSchema || { type: 'object', properties: {}, additionalProperties: false },
        }));

        toolCache.set(server.label, { fetchedAt: Date.now(), tools: mapped });
        discovered.push(...mapped);
      } catch (err) {
        // Isolasi kegagalan satu server eksternal agar tidak memutus percakapan utama
        log.warn(`Gagal memuat tools dari MCP server '${server.label}'`, { message: err.message });
      }
    }

    return discovered;
  },

  /** Memanggil tool pada MCP server eksternal berdasarkan nama terkualifikasi `mcp__<label>__<toolName>`. */
  async callQualifiedTool(qualifiedName, args = {}) {
    const match = /^mcp__([A-Za-z0-9_-]+)__(.+)$/.exec(qualifiedName || '');
    if (!match) throw badRequest(`Nama tool MCP '${qualifiedName}' tidak valid`);
    const [, serverLabel, remoteName] = match;

    const server = getConfiguredServers().find((s) => s.label === serverLabel && s.execution === 'backend');
    if (!server) {
      throw badRequest(`MCP server '${serverLabel}' tidak terdaftar atau tidak aktif`);
    }
    if (server.allowedTools && !server.allowedTools.includes(remoteName)) {
      throw badRequest(`Tool '${remoteName}' tidak diizinkan pada MCP server '${serverLabel}'`);
    }

    const result = await withMcpClient(server, (client) =>
      client.callTool({ name: remoteName, arguments: args ?? {} }),
    );

    const parsed = parseMcpToolContent(result);
    if (result?.isError) {
      throw upstreamError(
        'MCP_TOOL',
        typeof parsed === 'string' ? parsed : parsed?.error?.message || `Tool MCP '${remoteName}' mengembalikan error`,
        502,
        typeof parsed === 'object' ? parsed : null,
      );
    }

    return {
      serverLabel,
      tool: remoteName,
      data: parsed,
    };
  },

  /** Ringkasan status seluruh koneksi MCP server tanpa membocorkan token autentikasi. */
  async getServersStatus({ probe = false } = {}) {
    const servers = getConfiguredServers();
    const statuses = [];
    for (const s of servers) {
      const base = {
        label: s.label,
        url: s.url,
        execution: s.execution,
        hasAuthToken: Boolean(s.authToken),
        allowedTools: s.allowedTools,
        requireApproval: s.requireApproval,
      };
      if (probe && s.execution === 'backend') {
        try {
          const listResult = await withMcpClient(s, (client) => client.listTools());
          statuses.push({ ...base, reachable: true, toolCount: listResult?.tools?.length ?? 0 });
        } catch (err) {
          statuses.push({ ...base, reachable: false, error: err.message });
        }
      } else {
        statuses.push(base);
      }
    }
    return statuses;
  },

  /** Helper khusus pengujian & pembaruan runtime daftar server MCP eksternal. */
  _setExternalServersForTesting(servers) {
    runtimeServers = servers;
    toolCache.clear();
  },
};

export default mcpClientService;
