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

    if (isSupabaseConfigured()) {
      try {
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

        return {
          source: 'supabase',
          user: UserModel.fromSupabaseUser(data.user),
          session: data.session
            ? {
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
                expiresIn: data.session.expires_in,
              }
            : null,
          message: data.session
            ? 'Registrasi berhasil'
            : 'Registrasi berhasil. Silakan cek email Anda untuk konfirmasi pendaftaran.',
        };
      } catch (err) {
        console.warn('[AuthService] Supabase signUp failed:', err.message);
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

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

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
    const defaultRedirect = `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'}/auth/callback`;
    const targetRedirect = redirectTo || defaultRedirect;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
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
          provider: 'google',
          url: data.url,
        };
      } catch (err) {
        console.warn('[AuthService] Google OAuth error:', err.message);
        const error = new Error(err.message || 'Gagal memulai login Google');
        error.status = err.status || 500;
        throw error;
      }
    }

    return {
      source: 'local-fallback',
      provider: 'google',
      url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=simulated-google-client-id&redirect_uri=${encodeURIComponent(
        targetRedirect
      )}&response_type=code&scope=email%20profile`,
      note: 'Simulasi URL OAuth Google (Masukkan kredensial Supabase untuk URL OAuth produksi)',
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

    if (isSupabaseConfigured()) {
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

    if (isSupabaseConfigured() && accessToken) {
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

    if (isSupabaseConfigured()) {
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

    if (isSupabaseConfigured()) {
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
