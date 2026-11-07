import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { authService } from '../services/authService.js';
import { AppError, badRequest } from '../utils/errors.js';

const safeTokenEquals = (provided, expected) => {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/** Header keamanan standar untuk seluruh respons API. */
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

/** Mencegah caching pada respons yang memuat token sesi atau ephemeral client secret. */
export function noStore(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
}

/**
 * Autentikasi untuk endpoint AI, Realtime, Maps, dan Tool Relay.
 * Bila `AI_REQUIRE_AUTH=true`, Bearer token sesi pengguna wajib valid.
 */
export async function aiAuthGuard(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (config.security.aiRequireAuth) {
      if (!authHeader) {
        throw new AppError(401, 'AUTH_REQUIRED', 'Autentikasi diperlukan untuk mengakses layanan AI');
      }
      req.user = await authService.getCurrentUser(authHeader);
      return next();
    }

    if (authHeader) {
      try {
        req.user = await authService.getCurrentUser(authHeader);
      } catch {
        req.user = null;
      }
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Autentikasi Bearer token khusus endpoint protokol MCP (`/api/mcp`).
 * Di production, `MCP_SERVER_AUTH_TOKEN` wajib diatur agar server MCP tidak terbuka bebas.
 */
export function mcpAuthGuard(req, res, next) {
  const expected = config.mcp.serverAuthToken;

  if (!expected) {
    if (config.isProduction) {
      return res.status(503).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'MCP_SERVER_AUTH_TOKEN wajib dikonfigurasi di environment production.',
        },
        id: null,
      });
    }
    return next();
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token || !safeTokenEquals(token, expected)) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized: Bearer token MCP tidak valid.' },
      id: null,
    });
  }

  return next();
}

/** Rate limiter umum untuk endpoint AI, Web Search, dan Google Maps. */
export const aiRateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.isTest && process.env.TEST_ENABLE_RATE_LIMIT !== 'true',
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Terlalu banyak permintaan dalam waktu singkat. Silakan coba beberapa saat lagi.',
  },
});

/** Rate limiter lebih ketat untuk pembuatan sesi suara / ephemeral token Realtime. */
export const realtimeSessionRateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.realtimeSessionLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.isTest && process.env.TEST_ENABLE_RATE_LIMIT !== 'true',
  message: {
    success: false,
    code: 'REALTIME_RATE_LIMITED',
    message: 'Batas pembuatan sesi suara Realtime tercapai. Silakan tunggu sebentar.',
  },
});

const formatZodIssues = (issues) =>
  issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`);

/** Middleware validasi `req.body` berbasis skema Zod. */
export const validateBody = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const details = formatZodIssues(parsed.error.issues);
    return next(badRequest(`Validasi input gagal: ${details[0]}`, details));
  }
  req.body = parsed.data;
  return next();
};

/** Middleware validasi `req.query` berbasis skema Zod. */
export const validateQuery = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.query ?? {});
  if (!parsed.success) {
    const details = formatZodIssues(parsed.error.issues);
    return next(badRequest(`Parameter query tidak valid: ${details[0]}`, details));
  }
  req.validatedQuery = parsed.data;
  return next();
};
