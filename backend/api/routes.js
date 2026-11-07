import { Router } from 'express';
import { itemsController } from './itemsController.js';
import { authController } from './authController.js';
import { openaiService } from '../services/openaiService.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Teralio Express Backend',
  });
});

// Supabase integration status endpoint
router.get('/supabase-status', itemsController.getSupabaseStatus);

// Authentication & User Management Endpoints
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/google', authController.getGoogleAuth);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/me', authController.getMe);
router.post('/auth/logout', authController.logout);

// Items CRUD endpoints
router.get('/items', itemsController.getItems);
router.get('/items/:id', itemsController.getItemById);
router.post('/items', itemsController.createItem);

// OpenAI endpoints
router.get('/openai/status', (req, res) => {
  const status = openaiService.getStatus();
  return res.status(200).json({
    success: true,
    data: status,
  });
});

router.post('/openai/chat', async (req, res, next) => {
  try {
    const result = await openaiService.chat(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
