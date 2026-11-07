import { describe, it, expect } from 'vitest';
import { ItemModel } from '../models/itemModel.js';
import { isSupabaseConfigured, getSupabaseConfig, getSupabaseClient } from '../services/supabaseService.js';

describe('Backend Services & Models Unit Tests', () => {
  describe('ItemModel Validator', () => {
    it('memvalidasi data valid dengan benar', () => {
      const valid = ItemModel.validate({
        title: 'Valid Title',
        description: 'Valid Description',
      });
      expect(valid.isValid).toBe(true);
      expect(valid.errors.length).toBe(0);
    });

    it('menolak data tanpa title', () => {
      const invalid = ItemModel.validate({
        description: 'Only description',
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });

    it('menolak title yang melebihi batas 100 karakter', () => {
      const invalid = ItemModel.validate({
        title: 'a'.repeat(101),
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors[0]).toContain('must not exceed 100 characters');
    });

    it('mengubah database row menjadi instance ItemModel', () => {
      const row = {
        id: '123',
        title: 'Row Item',
        description: 'From DB',
        category: 'Database',
        created_at: '2026-01-01T00:00:00Z',
      };
      const model = ItemModel.fromDatabaseRow(row);
      expect(model).toBeInstanceOf(ItemModel);
      expect(model.id).toBe('123');
      expect(model.createdAt).toBe('2026-01-01T00:00:00Z');
    });
  });

  describe('Supabase Service Helper', () => {
    it('mengembalikan status konfigurasi Supabase', () => {
      const config = getSupabaseConfig();
      expect(config).toHaveProperty('url');
      expect(config).toHaveProperty('hasKey');
      expect(typeof config.isConfigured).toBe('boolean');
    });

    it('menginisialisasi Supabase client tanpa throw error', () => {
      const client = getSupabaseClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe('function');
    });
  });
});
