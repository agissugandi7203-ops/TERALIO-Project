import { itemsService } from '../services/itemsService.js';
import { getSupabaseConfig } from '../services/supabaseService.js';

export const itemsController = {
  // GET /api/items
  async getItems(req, res, next) {
    try {
      const result = await itemsService.getAll();
      return res.status(200).json({
        success: true,
        source: result.source,
        count: result.items.length,
        data: result.items,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/items/:id
  async getItemById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await itemsService.getById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Item dengan ID '${id}' tidak ditemukan`,
        });
      }

      return res.status(200).json({
        success: true,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/items
  async createItem(req, res, next) {
    try {
      const result = await itemsService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Item berhasil dibuat',
        source: result.source,
        data: result.item,
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/supabase-status
  getSupabaseStatus(req, res) {
    const config = getSupabaseConfig();
    return res.status(200).json({
      success: true,
      service: 'Supabase',
      configured: config.isConfigured,
      details: {
        urlProvided: Boolean(config.url),
        hasKey: config.hasKey,
        mode: config.isConfigured ? 'Connected to Supabase' : 'Using Placeholder (Provide credentials in .env)',
      },
    });
  },
};
