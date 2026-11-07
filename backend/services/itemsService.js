import { supabase, isSupabaseConfigured } from './supabaseService.js';
import { ItemModel } from '../models/itemModel.js';

// In-memory fallback dataset untuk testing / development sebelum Supabase credentials dipasang
let memoryItems = [
  new ItemModel({
    id: '1',
    title: 'Inisialisasi Project Frontend (Vite)',
    description: 'Setup struktur folder frontend dengan komponen React dan Vite bundler.',
    category: 'Frontend',
  }),
  new ItemModel({
    id: '2',
    title: 'Inisialisasi Backend (Express)',
    description: 'Setup Express server modular dengan routing, services, dan models.',
    category: 'Backend',
  }),
  new ItemModel({
    id: '3',
    title: 'Koneksi Supabase',
    description: 'Konfigurasi client Supabase pada frontend dan backend dengan credential check.',
    category: 'Database',
  }),
];

export const itemsService = {
  /**
   * Mengambil semua item dari Supabase atau fallback memori
   */
  async getAll() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return {
          source: 'supabase',
          items: data.map(ItemModel.fromDatabaseRow),
        };
      } catch (err) {
        console.warn('[ItemsService] Gagal mengambil data dari Supabase, beralih ke fallback:', err.message);
      }
    }

    return {
      source: 'local-fallback',
      items: memoryItems,
    };
  },

  /**
   * Mengambil item berdasarkan ID
   */
  async getById(id) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
        if (error) throw error;
        return ItemModel.fromDatabaseRow(data);
      } catch (err) {
        console.warn('[ItemsService] Supabase getById error:', err.message);
      }
    }

    return memoryItems.find((item) => String(item.id) === String(id)) || null;
  },

  /**
   * Membuat item baru
   */
  async create(payload) {
    const validation = ItemModel.validate(payload);
    if (!validation.isValid) {
      const error = new Error('Validation Failed');
      error.status = 400;
      error.details = validation.errors;
      throw error;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('items')
          .insert([
            {
              title: payload.title,
              description: payload.description || '',
              category: payload.category || 'General',
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return {
          source: 'supabase',
          item: ItemModel.fromDatabaseRow(data),
        };
      } catch (err) {
        console.warn('[ItemsService] Supabase create error, beralih ke memory:', err.message);
      }
    }

    const newItem = new ItemModel({
      id: String(memoryItems.length + 1),
      title: payload.title,
      description: payload.description || '',
      category: payload.category || 'General',
    });
    memoryItems.push(newItem);

    return {
      source: 'local-fallback',
      item: newItem,
    };
  },

  /**
   * Helper reset untuk keperluan automated testing
   */
  _resetMemoryItems(items = []) {
    memoryItems = [...items];
  },
};
