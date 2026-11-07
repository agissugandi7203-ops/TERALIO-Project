import { authService } from '../services/authService.js';

export const authController = {
  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json({
        success: true,
        message: result.message,
        source: result.source,
        data: {
          user: result.user,
          session: result.session,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json({
        success: true,
        message: 'Login berhasil',
        source: result.source,
        data: {
          user: result.user,
          session: result.session,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/google
  async getGoogleAuth(req, res, next) {
    try {
      const { redirectTo } = req.query;
      const result = await authService.getGoogleOAuthUrl({ redirectTo });
      return res.status(200).json({
        success: true,
        message: 'Google OAuth URL berhasil dibuat',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/github
  async getGithubAuth(req, res, next) {
    try {
      const { redirectTo } = req.query;
      const result = await authService.getOAuthUrl({ provider: 'github', redirectTo });
      return res.status(200).json({
        success: true,
        message: 'GitHub OAuth URL berhasil dibuat',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/oauth/:provider
  async getOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const { redirectTo } = req.query;
      const result = await authService.getOAuthUrl({ provider, redirectTo });
      return res.status(200).json({
        success: true,
        message: `${provider} OAuth URL berhasil dibuat`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req, res, next) {
    try {
      const { email, redirectTo } = req.body;
      const result = await authService.forgotPassword({ email, redirectTo });
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/reset-password
  async resetPassword(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const { newPassword } = req.body;
      const result = await authService.resetPassword({
        newPassword,
        accessToken: authHeader,
      });
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.user || null,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/me
  async getMe(req, res, next) {
    try {
      const token = req.headers.authorization;
      const user = await authService.getCurrentUser(token);
      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/logout
  async logout(req, res, next) {
    try {
      const token = req.headers.authorization;
      const result = await authService.logout(token);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  },
};
