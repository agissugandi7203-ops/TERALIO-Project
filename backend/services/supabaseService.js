import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const getSupabaseUrl = () => process.env.SUPABASE_URL || '';
const getSupabaseKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  if (process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST)) {
    return false;
  }
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return (
    Boolean(url) &&
    Boolean(key) &&
    !url.includes('placeholder') &&
    !key.includes('placeholder') &&
    (key.startsWith('ey') || key.startsWith('sb_') || key.split('.').length === 3)
  );
};

export const getSupabaseConfig = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return {
    url,
    hasKey: Boolean(key),
    isConfigured: isSupabaseConfigured(),
  };
};

/**
 * Inisialisasi Supabase Client.
 * Menggunakan URL dan Key dari environment variable.
 */
let supabaseInstance = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const validUrl = getSupabaseUrl() || 'https://placeholder.supabase.co';
    const validKey = getSupabaseKey() || 'placeholder-key';
    supabaseInstance = createClient(validUrl, validKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
};

// Export instance default
export const supabase = getSupabaseClient();
