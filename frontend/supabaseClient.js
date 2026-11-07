import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Cek apakah kredensial Supabase sudah diisi dengan benar (bukan placeholder)
 */
export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );
};

export const getSupabaseInfo = () => {
  return {
    url: supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey),
    isConfigured: isSupabaseConfigured(),
  };
};

// Fallback aman agar createClient tidak melempar uncaught error saat aplikasi pertama kali dijalankan
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey);
