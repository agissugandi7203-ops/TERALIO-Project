/**
 * UserModel & Authentication Schema Validator
 * Menangani validasi data akun pengguna, login, registrasi, forgot password,
 * serta pemetaan entitas profil pengguna dari Supabase Auth.
 */

export class UserModel {
  constructor({
    id,
    email,
    fullName = '',
    avatarUrl = '',
    provider = 'email',
    createdAt = new Date().toISOString(),
    lastSignInAt = null,
  }) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.avatarUrl = avatarUrl;
    this.provider = provider;
    this.createdAt = createdAt;
    this.lastSignInAt = lastSignInAt;
  }

  /**
   * Validasi format email standar RFC 5322
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  /**
   * Validasi payload registrasi akun baru (Email + Password)
   */
  static validateRegister(data) {
    const errors = [];

    if (!data) {
      return { isValid: false, errors: ['Request body tidak boleh kosong'] };
    }

    const { email, password, fullName } = data;

    if (!email || !this.isValidEmail(email)) {
      errors.push('Field "email" wajib diisi dengan alamat email yang valid');
    }

    if (!password || typeof password !== 'string') {
      errors.push('Field "password" wajib diisi');
    } else if (password.length < 6) {
      errors.push('Field "password" minimal harus terdiri dari 6 karakter');
    }

    if (fullName !== undefined && typeof fullName !== 'string') {
      errors.push('Field "fullName" harus berupa string');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validasi payload login (Email + Password)
   */
  static validateLogin(data) {
    const errors = [];

    if (!data) {
      return { isValid: false, errors: ['Request body tidak boleh kosong'] };
    }

    const { email, password } = data;

    if (!email || !this.isValidEmail(email)) {
      errors.push('Field "email" wajib diisi dengan format email yang valid');
    }

    if (!password || typeof password !== 'string') {
      errors.push('Field "password" wajib diisi');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validasi permintaan lupa password
   */
  static validateForgotPassword(data) {
    const errors = [];

    if (!data || !data.email || !this.isValidEmail(data.email)) {
      errors.push('Field "email" wajib diisi dengan format email yang valid');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validasi pembaruan password (reset password)
   */
  static validateResetPassword(data) {
    const errors = [];

    if (!data) {
      return { isValid: false, errors: ['Request body tidak boleh kosong'] };
    }

    const { newPassword } = data;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      errors.push('Field "newPassword" wajib diisi minimal 6 karakter');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Mengonversi User object dari Supabase Auth menjadi instance UserModel
   */
  static fromSupabaseUser(user) {
    if (!user) return null;

    const userMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};

    return new UserModel({
      id: user.id,
      email: user.email,
      fullName: userMetadata.full_name || userMetadata.name || '',
      avatarUrl: userMetadata.avatar_url || userMetadata.picture || '',
      provider: appMetadata.provider || 'email',
      createdAt: user.created_at || new Date().toISOString(),
      lastSignInAt: user.last_sign_in_at || null,
    });
  }
}
