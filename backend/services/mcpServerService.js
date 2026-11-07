import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from '../config/env.js';
import { createLogger } from '../utils/logger.js';
import { toolOrchestrator } from './toolOrchestrator.js';

/**
 * TERALIO MCP Server berbasis protokol resmi Streamable HTTP (`@modelcontextprotocol/sdk`).
 *
 * Menggunakan mode stateless (`sessionIdGenerator: undefined`, `enableJsonResponse: true`)
 * sehingga kompatibel penuh baik pada proses Express persisten maupun Vercel Serverless Functions,
 * serta dapat dihubungkan langsung oleh OpenAI Remote MCP (`type: "mcp"`) atau MCP Client standar.
 */
const log = createLogger('McpServer');

export function createTeralioMcpServer() {
  const server = new McpServer(
    {
      name: 'teralio-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  for (const def of toolOrchestrator.getLocalMcpDefinitions()) {
    server.registerTool(
      def.name,
      {
        title: def.title,
        description: def.description,
        inputSchema: def.schema,
      },
      async (args) => {
        const result = await toolOrchestrator.executeToolCall(def.name, args, { throwOnError: false });
        if (!result.ok) {
          return {
            isError: true,
            content: [{ type: 'text', text: JSON.stringify(result.error) }],
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(result.data) }],
        };
      },
    );
  }

  return server;
}

export const mcpServerService = {
  getStatus() {
    return {
      service: 'TERALIO MCP Server',
      enabled: config.mcp.serverEnabled,
      protocol: 'Streamable HTTP (stateless JSON-RPC 2.0)',
      endpoint: '/api/mcp',
      authConfigured: Boolean(config.mcp.serverAuthToken),
      registeredTools: toolOrchestrator.getLocalMcpDefinitions().map((d) => d.name),
    };
  },

  /** Menangani request HTTP POST `/api/mcp` sesuai spesifikasi MCP Streamable HTTP. */
  async handleHttpRequest(req, res) {
    if (!config.mcp.serverEnabled) {
      return res.status(503).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'MCP server dinonaktifkan pada konfigurasi server.' },
        id: null,
      });
    }

    const server = createTeralioMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      log.error('Kesalahan saat memproses request MCP', { message: err.message });
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal MCP server error' },
          id: null,
        });
      }
    }
  },
};

export default mcpServerService;
