import app from '../backend/app.js';

/**
 * Entrypoint Vercel Serverless Function
 * Menyalurkan request HTTP Vercel ke Express App
 */
export default function handler(req, res) {
  return app(req, res);
}
