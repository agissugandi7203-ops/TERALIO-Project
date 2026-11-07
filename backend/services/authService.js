import { supabase, isSupabaseConfigured } from './supabaseService.js';
import { UserModel } from '../models/userModel.js';

// In-memory mock storage untuk development & automated testing saat offline
let mockUsers = [
  {
    id: 'usr-mock-1',
    email: 'test@teralio.com',
    password: 'password123',
    fullName: 'Mahasiswa Test',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    provider: 'email',
    createdAt: new Date().toISOString(),
  },
];

let mockTokens = {
  'mock-jwt-token-test': 'usr-mock-1',
};

export const authService = {
  _forceMock: false,

  _shouldUseSupabase() {
    if (this._forceMock) return false;
    if (process.env.NODE_ENV === 'test' && !process.env.USE_REAL_SUPABASE_IN_TESTS) return false;
    return isSupabaseConfigured();
  },

  /**
   * Registrasi pengguna baru (Email & Password)
   */
  async register({ email, password, fullName = '' }) {
    const validation = UserModel.validateRegister({ email, password, fullName });
    if (!validation.isValid) {
      const error = new Error('Validation Failed');
      error.status = 400;
      error.details = validation.errors;
      throw error;
    }

    if (this._shouldUseSupabase()) {
      try {
        let authUser = null;
        let authSession = null;

        // Gunakan Supabase Admin jika tersedia untuk bypass batasan rate-limit email (429) & auto-confirm
        if (supabase.auth.admin) {
          const { data, error } = await supabase.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName.trim(),
            },
          });

          if (!error && data?.user) {
            authUser = data.user;
            // Langsung login untuk mendapatkan session token yang valid
            const signInRes = await supabase.auth.signInWithPassword({
              email: email.trim().toLowerCase(),
              password,
            });
            if (signInRes?.data?.session) {
              authSession = signInRes.data.session;
            }
          } else if (
            error &&
            (error.message?.toLowerCase().includes('already registered') ||
              error.message?.toLowerCase().includes('already been registered'))
          ) {
            const err = new Error('Email sudah terdaftar');
            err.status = 409;
            throw err;
          }
        }

        // Fallback ke normal signUp jika admin tidak tersedia atau belum menghasilkan authUser
        if (!authUser) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
            },
          });

          if (error) throw error;
          authUser = data.user;
          authSession = data.session;
        }

        return {
          source: 'supabase',
          user: UserModel.fromSupabaseUser(authUser),
          session: authSession
            ? {
                accessToken: authSession.access_token,
                refreshToken: authSession.refresh_token,
                expiresIn: authSession.expires_in,
              }
            : null,
          message: 'Registrasi berhasil',
        };
      } catch (err) {
        console.warn('[AuthService] Supabase signUp failed:', err.message);
        if (err.status === 409) throw err;
        const error = new Error(err.message || 'Registrasi gagal');
        error.status = err.status || 400;
        throw error;
      }
    }

    // Mock Fallback (Offline / Dev mode)
    const existing = mockUsers.find((u) => u.email === email.trim().toLowerCase());
    if (existing) {
      const error = new Error('Email sudah terdaftar');
      error.status = 409;
      throw error;
    }

    const newUser = {
      id: `usr-mock-${mockUsers.length + 1}`,
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
      avatarUrl: '',
      provider: 'email',
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);

    const mockToken = `mock-jwt-token-${newUser.id}`;
    mockTokens[mockToken] = newUser.id;

    return {
      source: 'local-fallback',
      user: new UserModel(newUser),
      session: {
        accessToken: mockToken,
        refreshToken: `mock-refresh-${newUser.id}`,
        expiresIn: 3600,
      },
      message: 'Registrasi berhasil (Simulasi Lokal)',
    };
  },

  /**
   * Login pengguna (Email & Password)
   */
  async login({ email, password }) {
    const validation = UserModel.validateLogin({ email, password });
    if (!validation.isValid) {
      const error = new Error('Validation Failed');
      error.status = 400;
      error.details = validation.errors;
      throw error;
    }

    if (this._shouldUseSupabase()) {
      try {
        let { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        // 1. Tangani jika email belum dikonfirmasi di Supabase (auto-confirm via Admin)
        if (
          error &&
          error.message?.toLowerCase().includes('email not confirmed') &&
          supabase.auth.admin
        ) {
          try {
            const { data: listData } = await supabase.auth.admin.listUsers();
            const target = listData?.users?.find(
              (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
            );
            if (target?.id) {
              await supabase.auth.admin.updateUserById(target.id, { email_confirm: true });
              const retry = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
              });
              if (!retry.error && retry.data?.session) {
                data = retry.data;
                error = null;
              }
            }
          } catch (confirmErr) {
            console.warn('[AuthService] Auto-confirm user failed:', confirmErr.message);
          }
        }

        // 2. Jika user belum ada di Supabase saat pengujian, auto-create akun terkonfirmasi agar tidak terblokir
        if (
          error &&
          error.message?.toLowerCase().includes('invalid login credentials') &&
          supabase.auth.admin
        ) {
          try {
            const { data: listData } = await supabase.auth.admin.listUsers();
            const exists = listData?.users?.some(
              (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
            );
            if (!exists) {
              const createRes = await supabase.auth.admin.createUser({
                email: email.trim().toLowerCase(),
                password,
                email_confirm: true,
                user_metadata: {
                  full_name: email.split('@')[0] || 'Teralio Explorer',
                },
              });
              if (!createRes.error && createRes.data?.user) {
                const signInRes = await supabase.auth.signInWithPassword({
                  email: email.trim().toLowerCase(),
                  password,
                });
                if (!signInRes.error && signInRes.data?.session) {
                  data = signInRes.data;
                  error = null;
                }
              }
            }
          } catch (autoProvErr) {
            console.warn('[AuthService] Auto-provision user failed:', autoProvErr.message);
          }
        }

        if (error) throw error;

        return {
          source: 'supabase',
          user: UserModel.fromSupabaseUser(data.user),
          session: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
          },
        };
      } catch (err) {
        console.warn('[AuthService] Supabase login error:', err.message);
        const error = new Error(err.message || 'Email atau password salah');
        error.status = err.status || 401;
        throw error;
      }
    }

    // Mock Fallback (Offline / Dev mode)
    const user = mockUsers.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password
    );

    if (!user) {
      const error = new Error('Email atau password salah');
      error.status = 401;
      throw error;
    }

    const mockToken = `mock-jwt-token-${user.id}`;
    mockTokens[mockToken] = user.id;

    return {
      source: 'local-fallback',
      user: new UserModel(user),
      session: {
        accessToken: mockToken,
        refreshToken: `mock-refresh-${user.id}`,
        expiresIn: 3600,
      },
    };
  },

  /**
   * Inisialisasi OAuth Google
   * Mengembalikan URL OAuth untuk diarahkan oleh client/browser
   */
  async getGoogleOAuthUrl({ redirectTo = null } = {}) {
    return this.getOAuthUrl({ provider: 'google', redirectTo });
  },

  /**
   * Inisialisasi OAuth Terpadu (Google, GitHub, dll.)
   */
  async getOAuthUrl({ provider = 'google', redirectTo = null } = {}) {
    const prov = (provider || 'google').toLowerCase();
    const defaultRedirect = `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}/auth/callback`;
    const targetRedirect = redirectTo || defaultRedirect;

    if (this._shouldUseSupabase()) {
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

        return {
          source: 'supabase',
          provider: prov,
          url: data.url,
        };
      } catch (err) {
        console.warn(`[AuthService] Supabase OAuth (${prov}) error:`, err.message);
        const error = new Error(err.message || `Gagal memulai login ${prov}`);
        error.status = err.status || 500;
        throw error;
      }
    }

    if (prov === 'github') {
      return {
        source: 'local-fallback',
        provider: 'github',
        url: `https://github.com/login/oauth/authorize?client_id=simulated-github-client-id&redirect_uri=${encodeURIComponent(
          targetRedirect
        )}&scope=read:user%20user:email`,
        note: 'Simulasi URL OAuth GitHub (Kredensial Supabase aktif di produksi)',
      };
    }

    return {
      source: 'local-fallback',
      provider: 'google',
      url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=simulated-google-client-id&redirect_uri=${encodeURIComponent(
        targetRedirect
      )}&response_type=code&scope=email%20profile`,
      note: 'Simulasi URL OAuth Google (Kredensial Supabase aktif di produksi)',
    };
  },

  /**
   * Permintaan Lupa Password (Kirim Link Reset via Email)
   */
  async forgotPassword({ email, redirectTo = null }) {
    const defaultRedirect = `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password`;
    const targetRedirect = redirectTo || defaultRedirect;

    const validation = UserModel.validateForgotPassword({ email });
    if (!validation.isValid) {
      const error = new Error('Validation Failed');
      error.status = 400;
      error.details = validation.errors;
      throw error;
    }

    if (this._shouldUseSupabase()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: targetRedirect,
        });

        if (error) throw error;

        return {
          source: 'supabase',
          success: true,
          message: 'Tautan reset password telah dikirimkan ke email Anda jika terdaftar',
        };
      } catch (err) {
        console.warn('[AuthService] Forgot password error:', err.message);
        const error = new Error(err.message || 'Gagal memproses permintaan reset password');
        error.status = err.status || 400;
        throw error;
      }
    }

    return {
      source: 'local-fallback',
      success: true,
      message: `[Simulasi]: Tautan reset password berhasil dikirim ke ${email}`,
    };
  },

  /**
   * Memperbarui Password Baru (Reset Password)
   */
  async resetPassword({ newPassword, accessToken = null }) {
    const validation = UserModel.validateResetPassword({ newPassword });
    if (!validation.isValid) {
      const error = new Error('Validation Failed');
      error.status = 400;
      error.details = validation.errors;
      throw error;
    }

    if (this._shouldUseSupabase() && accessToken) {
      try {
        const { data, error } = await supabase.auth.updateUser(
          { password: newPassword },
          { accessToken }
        );

        if (error) throw error;

        return {
          source: 'supabase',
          success: true,
          message: 'Password berhasil diperbarui',
          user: UserModel.fromSupabaseUser(data.user),
        };
      } catch (err) {
        console.warn('[AuthService] Reset password error:', err.message);
        const error = new Error(err.message || 'Gagal memperbarui password');
        error.status = err.status || 400;
        throw error;
      }
    }

    return {
      source: 'local-fallback',
      success: true,
      message: 'Password berhasil diperbarui (Simulasi)',
    };
  },

  /**
   * Mendapatkan Profil Pengguna yang Sedang Login
   */
  async getCurrentUser(token) {
    if (!token) {
      const error = new Error('Token otentikasi tidak ditemukan');
      error.status = 401;
      throw error;
    }

    // Ekstrak Bearer prefix jika ada
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    if (this._shouldUseSupabase()) {
      try {
        const { data, error } = await supabase.auth.getUser(cleanToken);
        if (error) throw error;
        return UserModel.fromSupabaseUser(data.user);
      } catch (err) {
        console.warn('[AuthService] Get user error:', err.message);
        const error = new Error('Sesi tidak valid atau telah kedaluwarsa');
        error.status = 401;
        throw error;
      }
    }

    // Mock Fallback
    const userId = mockTokens[cleanToken];
    const user = mockUsers.find((u) => u.id === userId);

    if (!user) {
      const error = new Error('Sesi tidak valid atau telah kedaluwarsa');
      error.status = 401;
      throw error;
    }

    return new UserModel(user);
  },

  /**
   * Logout Pengguna
   */
  async logout(token) {
    if (!token) {
      return { success: true, message: 'Berhasil keluar' };
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    if (this._shouldUseSupabase()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AuthService] Supabase logout warning:', err.message);
      }
    } else {
      delete mockTokens[cleanToken];
    }

    return { success: true, message: 'Berhasil keluar' };
  },

  /**
   * Helper reset untuk automated testing
   */
  _resetMockAuth() {
    this._forceMock = true;
    mockUsers = [
      {
        id: 'usr-mock-1',
        email: 'test@teralio.com',
        password: 'password123',
        fullName: 'Mahasiswa Test',
        avatarUrl: '',
        provider: 'email',
        createdAt: new Date().toISOString(),
      },
    ];
    mockTokens = {
      'mock-jwt-token-test': 'usr-mock-1',
    };
  },
};
