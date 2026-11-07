import express, { Router } from 'express';
import { accommodationsController } from './accommodationsController.js';
import { authController } from './authController.js';
import { itemsController } from './itemsController.js';
import {
  geocodeSchema,
  mapsController,
  placeDetailsQuerySchema,
  placesSearchBodySchema,
  placesSearchQuerySchema,
  routesBodySchema,
} from './mapsController.js';
import { directToolCallSchema, mcpController } from './mcpController.js';
import { openaiController, responsesBodySchema, webSearchBodySchema } from './openaiController.js';
import {
  realtimeController,
  realtimeSessionOptionsSchema,
  realtimeToolRelaySchema,
  sidebandAttachSchema,
} from './realtimeController.js';
import {
  aiAuthGuard,
  aiRateLimiter,
  mcpAuthGuard,
  noStore,
  realtimeSessionRateLimiter,
  validateBody,
  validateQuery,
} from '../middleware/security.js';
import { config } from '../config/env.js';
import { googleMapsService } from '../services/googleMapsService.js';
import { mcpServerService } from '../services/mcpServerService.js';
import { openaiService } from '../services/openaiService.js';
import { realtimeService } from '../services/realtimeService.js';
import { getSupabaseConfig } from '../services/supabaseService.js';
import { webSearchService } from '../services/webSearchService.js';

const router = Router();
const sdpTextParser = express.text({ type: ['application/sdp', 'text/plain'], limit: '128kb' });
const binaryAttachmentParser = express.raw({
  type: ['application/octet-stream', 'application/pdf', 'image/*', 'text/*'],
  limit: config.http.uploadLimit,
});

// Health check & aggregated backend integrations readiness
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Teralio Express Backend',
  });
});

router.get('/integrations/status', (req, res) => {
  const supa = getSupabaseConfig();
  return res.status(200).json({
    success: true,
    data: {
      supabase: { service: 'Supabase', configured: supa.isConfigured, hasKey: supa.hasKey },
      openai: openaiService.getStatus(),
      realtime: realtimeService.getStatus(),
      webSearch: webSearchService.getStatus(),
      mcp: mcpServerService.getStatus(),
      googleMaps: googleMapsService.getStatus(),
    },
  });
});

// Supabase integration status endpoint
router.get('/supabase-status', itemsController.getSupabaseStatus);

// Authentication & User Management Endpoints
router.post('/auth/register', noStore, authController.register);
router.post('/auth/login', noStore, authController.login);
router.get('/auth/google', noStore, authController.getGoogleAuth);
router.post('/auth/forgot-password', noStore, authController.forgotPassword);
router.post('/auth/reset-password', noStore, authController.resetPassword);
router.get('/auth/me', noStore, authController.getMe);
router.post('/auth/logout', noStore, authController.logout);

// Items / Accommodations CRUD endpoints
router.get('/items', itemsController.getItems);
router.get('/items/:id', itemsController.getItemById);
router.post('/items', itemsController.createItem);

// Smart Kos Match — Supabase Accommodations, Geospatial Route, & AI Search Stream
router.get('/accommodations', accommodationsController.listAccommodations);
router.get('/accommodations/:id', accommodationsController.getAccommodationById);
router.post('/accommodations/route', aiRateLimiter, accommodationsController.computeRoute);
router.post(
  '/accommodations/ai-search/stream',
  noStore,
  aiRateLimiter,
  accommodationsController.streamAiSearch,
);
router.post('/accommodations/seed', noStore, aiRateLimiter, aiAuthGuard, accommodationsController.seedSupabase);

// OpenAI Responses API, SSE Streaming, File Upload, & Web Search endpoints
router.get('/openai/status', openaiController.getStatus);
router.post('/openai/chat', aiRateLimiter, aiAuthGuard, openaiController.chat);
router.post(
  '/openai/responses',
  aiRateLimiter,
  aiAuthGuard,
  validateBody(responsesBodySchema),
  openaiController.createResponse,
);
router.post(
  '/openai/responses/stream',
  noStore,
  aiRateLimiter,
  aiAuthGuard,
  validateBody(responsesBodySchema),
  openaiController.streamResponse,
);
router.post(
  '/openai/files',
  noStore,
  aiRateLimiter,
  aiAuthGuard,
  binaryAttachmentParser,
  openaiController.uploadFile,
);
router.post(
  '/openai/web-search',
  aiRateLimiter,
  aiAuthGuard,
  validateBody(webSearchBodySchema),
  openaiController.webSearch,
);

// OpenAI Realtime Voice & WebRTC endpoints
router.get('/realtime/status', realtimeController.getStatus);
router.post(
  '/realtime/config',
  aiAuthGuard,
  validateBody(realtimeSessionOptionsSchema),
  realtimeController.previewConfig,
);
router.post(
  '/realtime/client-secrets',
  noStore,
  realtimeSessionRateLimiter,
  aiAuthGuard,
  validateBody(realtimeSessionOptionsSchema),
  realtimeController.createClientSecret,
);
router.post(
  '/realtime/calls',
  noStore,
  realtimeSessionRateLimiter,
  aiAuthGuard,
  sdpTextParser,
  realtimeController.createCall,
);
router.post(
  '/realtime/calls/:callId/hangup',
  aiRateLimiter,
  aiAuthGuard,
  realtimeController.hangupCall,
);
router.post(
  '/realtime/tool-call',
  aiRateLimiter,
  aiAuthGuard,
  validateBody(realtimeToolRelaySchema),
  realtimeController.executeToolCall,
);
router.get('/realtime/sideband', aiAuthGuard, realtimeController.listSidebands);
router.post(
  '/realtime/sideband',
  aiRateLimiter,
  aiAuthGuard,
  validateBody(sidebandAttachSchema),
  realtimeController.attachSideband,
);
router.delete('/realtime/sideband/:callId', aiAuthGuard, realtimeController.detachSideband);

// Model Context Protocol (MCP) Streamable HTTP Server & Tool Orchestration endpoints
router.post('/mcp', mcpAuthGuard, mcpController.handleProtocolPost);
router.get('/mcp', mcpController.handleMethodNotAllowed);
router.delete('/mcp', mcpController.handleMethodNotAllowed);
router.get('/mcp/status', aiAuthGuard, mcpController.getStatus);
router.get('/mcp/tools', aiAuthGuard, mcpController.listTools);
router.post(
  '/mcp/tools/call',
  aiRateLimiter,
  aiAuthGuard,
  validateBody(directToolCallSchema),
  mcpController.callTool,
);

// Google Maps Platform Server-Side endpoints
router.get('/maps/status', mapsController.getStatus);
router.get(
  '/maps/places/search',
  aiRateLimiter,
  aiAuthGuard,
  validateQuery(placesSearchQuerySchema),
  mapsController.searchPlacesGet,
);
router.post(
  '/maps/places/search',
  aiRateLimiter,
  aiAuthGuard,
  validateBody(placesSearchBodySchema),
  mapsController.searchPlacesPost,
);
router.get(
  '/maps/places/:placeId',
  aiRateLimiter,
  aiAuthGuard,
  validateQuery(placeDetailsQuerySchema),
  mapsController.getPlaceDetails,
);
router.get(
  '/maps/geocode',
  aiRateLimiter,
  aiAuthGuard,
  validateQuery(geocodeSchema),
  mapsController.geocodeGet,
);
router.post(
  '/maps/geocode',
  aiRateLimiter,
  aiAuthGuard,
  validateBody(geocodeSchema),
  mapsController.geocodePost,
);
router.post(
  '/maps/routes',
  aiRateLimiter,
  aiAuthGuard,
  validateBody(routesBodySchema),
  mapsController.computeRoutes,
);

export default router;
