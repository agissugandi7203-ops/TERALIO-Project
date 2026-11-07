import { describe, it, expect } from 'vitest';
import { supabase, isSupabaseConfigured, getSupabaseInfo } from '../supabaseClient.js';

describe('Frontend Supabase Client', () => {
  it('berhasil diinisialisasi dan mengekspos API supabase standar', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
    expect(typeof supabase.auth.signUp).toBe('function');
  });

  it('mengembalikan informasi konfigurasi', () => {
    const info = getSupabaseInfo();
    expect(info).toHaveProperty('url');
    expect(info).toHaveProperty('hasAnonKey');
    expect(typeof info.isConfigured).toBe('boolean');
  });

  it('fungsi isSupabaseConfigured berjalan tanpa error', () => {
    const status = isSupabaseConfigured();
    expect(typeof status).toBe('boolean');
  });
});
