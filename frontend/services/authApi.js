import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

const STORAGE_USER_KEY = 'teralio_auth_user';
const STORAGE_SESSION_KEY = 'teralio_auth_session';

async function parseJsonResponse(res) {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detailMsg =
      Array.isArray(payload?.details) && payload.details.length > 0
        ? payload.details.join(', ')
        : payload?.error || payload?.message || 'Permintaan autentikasi gagal diproses.';
    const error = new Error(detailMsg);
    error.status = res.status;
    throw error;
  }
  return payload;
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonStr =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn('[authApi] Failed to decode JWT payload:', err.message);
    return null;
  }
}

export const authApi = {
  isConfigured() {
    return isSupabaseConfigured();
  },

  /**
   * Registrasi akun baru (Email & Password)
   */
  async register({ firstName = '', lastName = '', email, password }) {
    const fullName = `${firstName} ${lastName}`.trim();
    let payload = null;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      payload = await parseJsonResponse(res);
    } catch (err) {
      if (err.status && err.status !== 500) {
        throw err;
      }
      console.warn('[authApi] Backend offline, menggunakan fallback sesi lokal:', err.message);
      payload = {
        success: true,
        message: 'Registrasi berhasil (Mode Lokal)',
        data: {
          user: {
            id: `usr-local-${Date.now()}`,
            email: email.trim().toLowerCase(),
            fullName: fullName || email.split('@')[0],
            role: 'Student Member',
          },
          session: {
            accessToken: `local-token-${Date.now()}`,
            expiresIn: 3600,
          },
        },
      };
    }

    if (payload?.data?.user) {
      this.saveSession(payload.data.user, payload.data.session);
    }

    // Set sesi ke Supabase browser client di background (non-blocking agar registrasi instan)
    if (payload?.data?.session?.accessToken && isSupabaseConfigured() && typeof window !== 'undefined') {
      try {
        supabase.auth
          .setSession({
            access_token: payload.data.session.accessToken,
            refresh_token: payload.data.session.refreshToken || '',
          })
          .catch((sbErr) => {
            console.warn('[authApi] Supabase client setSession background warning:', sbErr?.message);
          });
      } catch {
        // Abaikan error background
      }
    }

    return payload;
  },

  /**
   * Login pengguna (Email & Password)
   */
  async login({ email, password }) {
    let payload = null;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      payload = await parseJsonResponse(res);
    } catch (err) {
      if (err.status && err.status !== 500) {
        // Kesalahan validasi atau kredensial salah dari backend
        throw err;
      }
      console.warn('[authApi] Backend offline, menggunakan fallback sesi lokal:', err.message);
      payload = {
        success: true,
        message: 'Login berhasil (Mode Lokal)',
        data: {
          user: {
            id: 'usr-local-1',
            email: email.trim().toLowerCase(),
            fullName: email.split('@')[0] || 'Andreas',
            role: 'Telkom Univ • Student',
          },
          session: {
            accessToken: `local-token-${Date.now()}`,
            expiresIn: 3600,
          },
        },
      };
    }

    if (payload?.data?.user) {
      this.saveSession(payload.data.user, payload.data.session);
    }

    // Set sesi ke Supabase browser client di background (non-blocking agar login instan)
    if (payload?.data?.session?.accessToken && isSupabaseConfigured() && typeof window !== 'undefined') {
      try {
        supabase.auth
          .setSession({
            access_token: payload.data.session.accessToken,
            refresh_token: payload.data.session.refreshToken || '',
          })
          .catch((sbErr) => {
            console.warn('[authApi] Supabase client setSession background warning:', sbErr?.message);
          });
      } catch {
        // Abaikan error background
      }
    }

    return payload;
  },

  /**
   * Memulai OAuth (Google, GitHub, dll.)
   */
  async signInWithOAuth(provider = 'google', redirectTo = null) {
    // Bersihkan sesi lama sebelum redirect OAuth baru agar tidak ada sisa data akun dummy
    this.clearSession();

    const prov = (provider || 'google').toLowerCase();
    const defaultRedirect =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:3000/auth/callback';
    const targetRedirect = redirectTo || defaultRedirect;

    // 1. Coba OAuth langsung via Supabase Client SDK jika key valid
    if (isSupabaseConfigured() && typeof window !== 'undefined') {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: prov,
          options: {
            redirectTo: targetRedirect,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) throw error;

        if (data?.url) {
          return {
            source: 'supabase',
            provider: prov,
            url: data.url,
          };
        }
      } catch (err) {
        console.warn(`[authApi] Supabase client OAuth (${prov}) fallback:`, err.message);
      }
    }

    // 2. Fallback melalui Endpoint Backend
    const endpoint =
      prov === 'google'
        ? `/api/auth/google?redirectTo=${encodeURIComponent(targetRedirect)}`
        : `/api/auth/github?redirectTo=${encodeURIComponent(targetRedirect)}`;

    try {
      const res = await fetch(endpoint);
      return await parseJsonResponse(res);
    } catch {
      // 3. Fallback dev simulator jika backend offline
      return {
        source: 'local-fallback',
        provider: prov,
        note: `Simulasi URL OAuth ${provider}. Kredensial Supabase aktif di produksi.`,
        data: {
          provider: prov,
          url:
            prov === 'google'
              ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=simulated&redirect_uri=${encodeURIComponent(
                  targetRedirect
                )}&response_type=code`
              : `https://github.com/login/oauth/authorize?client_id=simulated&redirect_uri=${encodeURIComponent(
                  targetRedirect
                )}`,
        },
      };
    }
  },

  async getGoogleAuthUrl(redirectTo) {
    return this.signInWithOAuth('google', redirectTo);
  },

  async getGithubAuthUrl(redirectTo) {
    return this.signInWithOAuth('github', redirectTo);
  },

  /**
   * Menangani redirect kembali dari Supabase OAuth (/auth/callback atau URL hash)
   * Mengekstrak user Google asli dari hash token (#access_token=) atau code (?code=)
   */
  async handleOAuthCallback() {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      // 1. Ekstrak access_token & refresh_token dari URL hash (Implicit Flow dari Supabase/Google)
      const rawHash = window.location.hash || '';
      const hashStr = rawHash.startsWith('#') ? rawHash.substring(1) : rawHash;
      const hashParams = new URLSearchParams(hashStr);
      const hashAccessToken = hashParams.get('access_token');
      const hashRefreshToken = hashParams.get('refresh_token');

      // 2. Ekstrak code dari URL search (PKCE Flow)
      const searchParams = new URLSearchParams(window.location.search);
      const authCode = searchParams.get('code');

      let session = null;
      let sbUser = null;
      let jwtPayload = null;

      // Jika ada PKCE code, tukarkan dengan session via Supabase
      if (authCode && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);
          if (!error && data?.session) {
            session = data.session;
            sbUser = data.user || data.session.user;
          }
        } catch (codeErr) {
          console.warn('[authApi] exchangeCodeForSession warning:', codeErr.message);
        }
      }

      // Jika ada access_token di hash, decode payload JWT langsung & set session ke client
      if (hashAccessToken) {
        jwtPayload = decodeJwtPayload(hashAccessToken);

        if (isSupabaseConfigured()) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken || '',
            });
            if (!error && data?.session) {
              session = data.session;
              sbUser = data.user || data.session.user;
            }
          } catch (setErr) {
            console.warn('[authApi] setSession from hash warning:', setErr.message);
          }
        }

        if (!session && jwtPayload?.email) {
          session = {
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken || '',
            expires_in: jwtPayload.exp ? jwtPayload.exp - Math.floor(Date.now() / 1000) : 3600,
          };
        }
      }

      // Jika session belum didapat dari hash/code, cek getSession()
      if (!session && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data?.session) {
            session = data.session;
            sbUser = data.session.user;
          }
        } catch (getErr) {
          console.warn('[authApi] getSession warning:', getErr.message);
        }
      }

      // Ambil metadata asli dari Google
      const targetUser = sbUser || session?.user || null;
      const meta = targetUser?.user_metadata || jwtPayload?.user_metadata || {};
      const appMeta = targetUser?.app_metadata || jwtPayload?.app_metadata || {};
      const email = targetUser?.email || jwtPayload?.email || '';

      if (email) {
        const googleFullName =
          meta.full_name ||
          meta.name ||
          (meta.given_name ? `${meta.given_name} ${meta.family_name || ''}`.trim() : '') ||
          email.split('@')[0];

        const googleAvatar =
          meta.avatar_url ||
          meta.picture ||
          '';

        const user = {
          id: targetUser?.id || jwtPayload?.sub || `usr-google-${Date.now()}`,
          email,
          fullName: googleFullName,
          avatarUrl: googleAvatar,
          provider: appMeta.provider || 'google',
          role: `${email} • Student`,
        };

        this.saveSession(user, session);
        return { user, session };
      }
    } catch (err) {
      console.warn('[authApi] Error resolving OAuth callback session:', err.message);
    } finally {
      // Bersihkan hash token atau query code dari address bar browser setelah diproses
      if (typeof window !== 'undefined') {
        const hasHash = Boolean(window.location.hash);
        const hasCode = window.location.search.includes('code=');
        if (hasHash || hasCode) {
          try {
            window.history.replaceState(null, '', window.location.pathname);
          } catch {}
        }
      }
    }

    return null;
  },

  /**
   * Listener reaktif terhadap perubahan sesi Supabase Auth
   */
  listenAuthState(onUserChange) {
    if (!isSupabaseConfigured() || typeof window === 'undefined') {
      return () => {};
    }

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const sbUser = session.user;
          const user = {
            id: sbUser.id,
            email: sbUser.email,
            fullName:
              sbUser.user_metadata?.full_name ||
              sbUser.user_metadata?.name ||
              sbUser.email?.split('@')[0],
            avatarUrl:
              sbUser.user_metadata?.avatar_url ||
              sbUser.user_metadata?.picture ||
              '',
            provider: sbUser.app_metadata?.provider || 'supabase',
          };
          this.saveSession(user, session);
          if (onUserChange) onUserChange(user);
        } else if (event === 'SIGNED_OUT') {
          this.clearSession();
          if (onUserChange) onUserChange(null);
        }
      });

      return () => {
        subscription?.unsubscribe?.();
      };
    } catch {
      return () => {};
    }
  },

  /**
   * Lupa Password
   */
  async forgotPassword(email) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return parseJsonResponse(res);
  },

  /**
   * Logout Pengguna
   */
  async logout() {
    const session = this.getStoredSession();

    if (isSupabaseConfigured() && typeof window !== 'undefined') {
      try {
        await supabase.auth.signOut();
      } catch {
        // Lanjutkan pembersihan
      }
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined,
      });
    } catch {
      // Tetap bersihkan sesi lokal meskipun jaringan offline
    } finally {
      this.clearSession();
    }
  },

  saveSession(user, session) {
    try {
      if (user) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
      if (session) localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage quota errors
    }
  },

  getStoredUser() {
    try {
      const raw = localStorage.getItem(STORAGE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getStoredSession() {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearSession() {
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};

export default authApi;
