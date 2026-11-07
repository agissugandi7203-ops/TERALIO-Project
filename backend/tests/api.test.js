import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { itemsService } from '../services/itemsService.js';
import { ItemModel } from '../models/itemModel.js';

describe('Express Backend API Tests', () => {
  beforeEach(() => {
    // Reset dataset in-memory sebelum setiap pengujian
    itemsService._resetMemoryItems([
      new ItemModel({ id: '1', title: 'Item 1', description: 'Desc 1', category: 'General' }),
      new ItemModel({ id: '2', title: 'Item 2', description: 'Desc 2', category: 'General' }),
    ]);
  });

  describe('GET /api/health', () => {
    it('harus mengembalikan status 200 dan status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body.service).toContain('Backend');
    });
  });

  describe('GET /api/supabase-status', () => {
    it('harus mengembalikan informasi status konfigurasi Supabase', async () => {
      const res = await request(app).get('/api/supabase-status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('service', 'Supabase');
      expect(res.body).toHaveProperty('configured');
      expect(res.body.details).toHaveProperty('hasKey');
    });
  });

  describe('OpenAI Endpoints', () => {
    it('GET /api/openai/status harus mengembalikan status integrasi OpenAI', async () => {
      const res = await request(app).get('/api/openai/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('service', 'OpenAI');
      expect(res.body.data).toHaveProperty('configured');
      expect(res.body.data).toHaveProperty('model');
    });

    it('POST /api/openai/chat harus mengembalikan respon (mock fallback saat dev/test)', async () => {
      const res = await request(app).post('/api/openai/chat').send({
        message: 'Halo, bagaimana kabarmu?',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('response');
      expect(res.body.data.response).toContain('Halo, bagaimana kabarmu?');
    });

    it('POST /api/openai/chat harus menolak request tanpa message atau prompt', async () => {
      const res = await request(app).post('/api/openai/chat').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('wajib diisi');
    });
  });

  describe('GET /api/items', () => {
    it('harus mengembalikan daftar item', async () => {
      const res = await request(app).get('/api/items');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].title).toBe('Item 1');
    });
  });

  describe('GET /api/items/:id', () => {
    it('harus mengembalikan detail item jika ID ditemukan', async () => {
      const res = await request(app).get('/api/items/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Item 1');
    });

    it('harus mengembalikan status 404 jika ID tidak ditemukan', async () => {
      const res = await request(app).get('/api/items/99999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('tidak ditemukan');
    });
  });

  describe('POST /api/items', () => {
    it('harus berhasil membuat item baru dengan payload valid', async () => {
      const payload = {
        title: 'Item Baru Dari Test',
        description: 'Deskripsi untuk item baru',
        category: 'Testing',
      };

      const res = await request(app).post('/api/items').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.category).toBe(payload.category);
    });

    it('harus menolak request dengan status 400 jika title kosong', async () => {
      const invalidPayload = {
        title: '',
        description: 'Deskripsi tanpa title',
      };

      const res = await request(app).post('/api/items').send(invalidPayload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0]).toContain('Field "title" is required');
    });
  });

  describe('404 Handler', () => {
    it('harus mengembalikan 404 untuk endpoint yang tidak terdaftar', async () => {
      const res = await request(app).get('/api/rute-acak-tidak-ada');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('tidak ditemukan');
    });
  });
});
