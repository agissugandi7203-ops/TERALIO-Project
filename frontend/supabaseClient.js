import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Validasi apakah key merupakan Supabase Anon Public Key yang valid:
 * Supabase anon key selalu berformat JWT (diawali 'ey' dengan 3 segmen titik '.')
 * atau kunci publishable format baru ('sb_').
 */
export const isValidSupabaseKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.includes('placeholder')) return false;
  return (
    trimmed.startsWith('ey') ||
    trimmed.startsWith('sb_') ||
    trimmed.split('.').length === 3
  );
};

/**
 * Cek apakah kredensial Supabase sudah diisi dengan benar (bukan placeholder & format key valid)
 */
export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes('placeholder') &&
    isValidSupabaseKey(supabaseAnonKey)
  );
};

export const getSupabaseInfo = () => {
  return {
    url: supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey),
    isValidKeyFormat: isValidSupabaseKey(supabaseAnonKey),
    isConfigured: isSupabaseConfigured(),
  };
};

// Fallback aman agar createClient tidak melempar uncaught error saat aplikasi pertama kali dijalankan
const safeUrl = (supabaseUrl && !supabaseUrl.includes('placeholder'))
  ? supabaseUrl
  : 'https://placeholder.supabase.co';

const safeKey = isValidSupabaseKey(supabaseAnonKey)
  ? supabaseAnonKey
  : 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: isSupabaseConfigured(),
    // Set false agar GoTrue tidak melempar error clock skew otomatis saat ada hash lama di URL
    detectSessionInUrl: false,
  },
});

export default supabase;
