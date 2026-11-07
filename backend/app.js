import express from 'express';
import cors from 'cors';
import routes from './api/routes.js';
import { config } from './config/env.js';
import { securityHeaders } from './middleware/security.js';
import { redact } from './utils/logger.js';

const app = express();

if (config.http.trustProxy) {
  app.set('trust proxy', 1);
}
app.disable('x-powered-by');

// Konfigurasi CORS: mengizinkan FRONTEND_URL (Vercel binding) dan daftar CORS_ORIGINS
const allowedOrigins = new Set([
  ...config.http.corsOrigins,
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []),
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || !config.isProduction || allowedOrigins.has('*') || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      const err = new Error('Origin tidak diizinkan oleh kebijakan CORS');
      err.status = 403;
      err.code = 'CORS_FORBIDDEN';
      return callback(err);
    },
    exposedHeaders: ['X-Realtime-Call-Id'],
  }),
);

app.use(securityHeaders);

// Izinkan batas payload lebih besar khusus rute AI yang mendukung lampiran (tetap aman di bawah batas 4.5MB Vercel)
const aiAttachmentPaths = [
  '/api/openai/responses',
  '/api/openai/responses/stream',
  '/api/openai/files',
  '/openai/responses',
  '/openai/responses/stream',
  '/openai/files',
];
app.use(aiAttachmentPaths, express.json({ limit: config.http.uploadLimit }));

app.use(express.json({ limit: config.http.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: config.http.jsonLimit }));

// API Routes (Mendukung akses /api/* secara lokal maupun saat di-rewrite oleh Vercel)
app.use('/api', routes);
app.use('/', routes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Rute '${req.method} ${req.originalUrl}' tidak ditemukan`,
  });
});

// Centralized Error Handling Middleware (dengan redaksi otomatis terhadap potensi credential)
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_JSON',
      message: 'Payload JSON tidak valid',
      errors: null,
    });
  }

  const status = Number(err.status) || 500;
  const code = err.code || (status === 400 ? 'BAD_REQUEST' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
  const safeMessage = redact(err.message || 'Internal Server Error');

  return res.status(status).json({
    success: false,
    code,
    message: safeMessage,
    errors: err.details || null,
  });
});

export default app;
