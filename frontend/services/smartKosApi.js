import { buildAuthHeaders, parseSseBlock } from './chatApi.js';

export const smartKosApi = {
  /**
   * Mengambil daftar kos terstruktur dari backend Supabase (`/api/accommodations`).
   */
  async fetchAccommodations({ campusId, query, signal } = {}) {
    const params = new URLSearchParams();
    if (campusId) params.set('campusId', campusId);
    if (query) params.set('query', query);

    const qs = params.toString();
    const res = await fetch(`/api/accommodations${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: buildAuthHeaders(),
      signal,
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || 'Gagal memuat katalog kos dari server.');
    }

    return {
      source: payload.source || 'supabase-mapped-seed',
      supabaseConfigured: Boolean(payload.supabaseConfigured),
      tableReady: Boolean(payload.tableReady),
      campusHubs: payload.campusHubs || null,
      items: Array.isArray(payload.data) ? payload.data : [],
    };
  },

  /**
   * Menghitung rute geospasial jalan kaki / motor bebas API key (`/api/accommodations/route`).
   */
  async fetchCampusRoute({ origin, destination, mode = 'foot', signal } = {}) {
    const res = await fetch('/api/accommodations/route', {
      method: 'POST',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ origin, destination, mode }),
      signal,
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      return null;
    }
    return payload.data || null;
  },

  /**
   * Mengambil daftar jadwal survei kos dinamis (`/api/accommodations/bookings`).
   */
  async fetchSurveyBookings({ userId, signal } = {}) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await fetch(`/api/accommodations/bookings${qs}`, {
      method: 'GET',
      headers: buildAuthHeaders(),
      signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) return [];
    return Array.isArray(payload.data) ? payload.data : [];
  },

  /**
   * Menyimpan jadwal survei kos baru secara dinamis ke backend/Supabase (`/api/accommodations/bookings`).
   */
  async createSurveyBooking(bookingPayload, { signal } = {}) {
    const res = await fetch('/api/accommodations/bookings', {
      method: 'POST',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(bookingPayload),
      signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || 'Gagal menyimpan jadwal survei kos.');
    }
    return payload.data;
  },

  /**
   * Memperbarui jam, tanggal, atau status janji temu survei (`/api/accommodations/bookings/:id`).
   */
  async updateSurveyBooking(id, patchPayload, { signal } = {}) {
    const res = await fetch(`/api/accommodations/bookings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(patchPayload),
      signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || 'Gagal memperbarui jadwal janji temu.');
    }
    return payload.data;
  },

  /**
   * Menghapus jadwal janji temu survei (`/api/accommodations/bookings/:id`).
   */
  async deleteSurveyBooking(id, { signal } = {}) {
    const res = await fetch(`/api/accommodations/bookings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: buildAuthHeaders(),
      signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || 'Gagal menghapus jadwal janji temu.');
    }
    return payload.data;
  },

  /**
   * Mengambil waktu aktual WIB dari server (`/api/accommodations/datetime`).
   */
  async fetchCurrentDatetime({ signal } = {}) {
    const res = await fetch('/api/accommodations/datetime', {
      method: 'GET',
      headers: buildAuthHeaders(),
      signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.success) return null;
    return payload.data || null;
  },

  /**
   * Streaming SSE pencarian AI & Voice Smart Kos (`/api/accommodations/ai-search/stream`):
   * menerima event `status` -> `redirect_location` -> `recommendations` -> `text_delta` -> `done`.
   */
  async streamSmartKosAiSearch(
    requestBody,
    {
      onStatus,
      onRedirectLocation,
      onRecommendations,
      onTextDelta,
      onDone,
      onError,
      signal,
    } = {},
  ) {
    const res = await fetch('/api/accommodations/ai-search/stream', {
      method: 'POST',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      }),
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!res.ok) {
      const errPayload = await res.json().catch(() => ({}));
      const err = new Error(errPayload?.message || `Pencarian AI gagal (${res.status}).`);
      err.status = res.status;
      throw err;
    }

    let donePayload = null;
    let streamError = null;

    const dispatchFrame = (parsed) => {
      if (!parsed) return;
      const { event, data } = parsed;
      switch (event) {
        case 'status':
          onStatus?.(data);
          break;
        case 'redirect_location':
          onRedirectLocation?.(data);
          break;
        case 'recommendations':
          onRecommendations?.(data);
          break;
        case 'text_delta':
          onTextDelta?.(data);
          break;
        case 'done':
          donePayload = data;
          onDone?.(data);
          break;
        case 'error': {
          const err = new Error(data?.message || 'Terjadi kendala saat streaming pencarian kos.');
          err.status = data?.status || 500;
          streamError = err;
          onError?.(err);
          break;
        }
        default:
          break;
      }
    };

    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            dispatchFrame(parseSseBlock(frame));
          }
        }

        buffer += decoder.decode().replace(/\r\n/g, '\n');
        if (buffer.trim()) {
          for (const frame of buffer.split('\n\n')) {
            dispatchFrame(parseSseBlock(frame));
          }
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // ignore lock release errors
        }
      }
    } else if (typeof res.text === 'function') {
      const fullText = (await res.text()).replace(/\r\n/g, '\n');
      for (const frame of fullText.split('\n\n')) {
        dispatchFrame(parseSseBlock(frame));
      }
    } else {
      throw new Error('Respons SSE tidak valid pada lingkungan ini.');
    }

    if (streamError) throw streamError;
    return donePayload;
  },
};

export default smartKosApi;
