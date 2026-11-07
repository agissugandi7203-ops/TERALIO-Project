import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { authService } from '../services/authService.js';

describe('Authentication & User Backend API Tests', () => {
  beforeEach(() => {
    // Reset dataset mock auth sebelum setiap test
    authService._resetMockAuth();
  });

  describe('POST /api/auth/register', () => {
    it('harus berhasil mendaftarkan user baru dengan payload valid', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'mahasiswa.baru@teralio.com',
        password: 'securepassword123',
        fullName: 'Budi Santoso',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('mahasiswa.baru@teralio.com');
      expect(res.body.data.user.fullName).toBe('Budi Santoso');
      expect(res.body.data.session).toHaveProperty('accessToken');
    });

    it('harus menolak registrasi jika email tidak valid', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'bukan-email',
        password: 'securepassword123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0]).toContain('email');
    });

    it('harus menolak registrasi jika password kurang dari 6 karakter', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'valid@teralio.com',
        password: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0]).toContain('minimal harus terdiri dari 6 karakter');
    });

    it('harus menolak registrasi jika email sudah terdaftar', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@teralio.com', // sudah ada di mock data
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('sudah terdaftar');
    });
  });

  describe('POST /api/auth/login', () => {
    it('harus berhasil login dengan kredensial yang benar', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@teralio.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@teralio.com');
      expect(res.body.data.session).toHaveProperty('accessToken');
    });

    it('harus menolak login dengan password yang salah (401)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@teralio.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('salah');
    });

    it('harus menolak login dengan format email kosong (400)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: '',
        password: 'somepassword',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /api/auth/google', () => {
    it('harus mengembalikan URL otentikasi Google OAuth', async () => {
      const res = await request(app).get('/api/auth/google?redirectTo=http://localhost:3000/callback');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('url');
      expect(res.body.data.provider).toBe('google');
      expect(res.body.data.url).toContain('accounts.google.com');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('harus berhasil memproses permintaan forgot password untuk email valid', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'test@teralio.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
    });

    it('harus menolak forgot password jika email tidak valid (400)', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'invalid-email',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('harus berhasil memperbarui password dengan password baru yang valid', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        newPassword: 'newsecurepassword2026',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('berhasil diperbarui');
    });

    it('harus menolak jika newPassword kurang dari 6 karakter (400)', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        newPassword: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('harus mengembalikan profil pengguna dengan token valid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer mock-jwt-token-test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@teralio.com');
      expect(res.body.data.fullName).toBe('Mahasiswa Test');
    });

    it('harus menolak akses tanpa token otentikasi (401)', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Token otentikasi tidak ditemukan');
    });

    it('harus menolak akses dengan token yang tidak valid (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-ngawur-palsu');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('tidak valid');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('harus berhasil logout dengan token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer mock-jwt-token-test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Berhasil keluar');
    });
  });
});
