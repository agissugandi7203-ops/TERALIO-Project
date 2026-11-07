import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseKey) &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseKey.includes('placeholder')
  );
};

export const getSupabaseConfig = () => {
  return {
    url: supabaseUrl,
    hasKey: Boolean(supabaseKey),
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
    const validUrl = supabaseUrl || 'https://placeholder.supabase.co';
    const validKey = supabaseKey || 'placeholder-key';
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
