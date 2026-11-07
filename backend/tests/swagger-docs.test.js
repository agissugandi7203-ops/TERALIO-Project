import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';

describe('Swagger UI & OpenAPI 3.0 Documentation', () => {
  it('menyediakan endpoint JSON OpenAPI spesifikasi di /api/openapi.json', async () => {
    const res = await request(app).get('/api/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('Teralio Backend API');
    expect(res.body.paths).toBeDefined();

    // Verifikasi endpoint-endpoint utama terdokumentasi
    expect(res.body.paths['/health']).toBeDefined();
    expect(res.body.paths['/accommodations']).toBeDefined();
    expect(res.body.paths['/accommodations/bookings']).toBeDefined();
    expect(res.body.paths['/accommodations/ai-search/stream']).toBeDefined();
    expect(res.body.paths['/auth/login']).toBeDefined();
    expect(res.body.paths['/openai/chat']).toBeDefined();
    expect(res.body.paths['/realtime/calls']).toBeDefined();
    expect(res.body.paths['/mcp/tools']).toBeDefined();
    expect(res.body.paths['/maps/places/search']).toBeDefined();
  });

  it('menyediakan endpoint JSON spesifikasi di /api/docs/openapi.json', async () => {
    const res = await request(app).get('/api/docs/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.version).toBe('1.0.0');
  });

  it('merender Swagger UI HTML di /api/docs/', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('swagger-ui');
  });

  it('merender Swagger UI HTML di /docs/', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('swagger-ui');
  });
});
