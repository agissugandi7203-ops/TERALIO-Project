import { z } from 'zod';
import { mcpClientService } from '../services/mcpClientService.js';
import { mcpServerService } from '../services/mcpServerService.js';
import { toolOrchestrator } from '../services/toolOrchestrator.js';

export const directToolCallSchema = z.object({
  name: z.string().min(1).max(150),
  arguments: z.union([z.string().max(20_000), z.record(z.string(), z.unknown())]).optional(),
});

export const mcpController = {
  // POST /api/mcp (Protokol MCP Streamable HTTP JSON-RPC 2.0)
  async handleProtocolPost(req, res) {
    return mcpServerService.handleHttpRequest(req, res);
  },

  // GET & DELETE /api/mcp (Mode stateless mengembalikan 405 sesuai spesifikasi MCP Streamable HTTP)
  handleMethodNotAllowed(req, res) {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed: server MCP berjalan dalam mode stateless (gunakan HTTP POST).',
      },
      id: null,
    });
  },

  // GET /api/mcp/status
  async getStatus(req, res, next) {
    try {
      const probe = req.query.probe === 'true';
      const externalServers = await mcpClientService.getServersStatus({ probe });
      return res.status(200).json({
        success: true,
        data: {
          localServer: mcpServerService.getStatus(),
          externalServers,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  // GET /api/mcp/tools
  async listTools(req, res, next) {
    try {
      const catalog = await toolOrchestrator.listAllTools({ includeExternalMcp: true });
      return res.status(200).json({
        success: true,
        data: catalog,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/mcp/tools/call
  async callTool(req, res, next) {
    try {
      const { name, arguments: args } = req.body;
      const result = await toolOrchestrator.executeToolCall(name, args, { throwOnError: true });
      return res.status(200).json({
        success: true,
        data: {
          tool: result.tool,
          source: result.source,
          durationMs: result.durationMs,
          result: result.data,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};

export default mcpController;
