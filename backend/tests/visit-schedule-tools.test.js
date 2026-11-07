import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { accommodationsService } from '../services/accommodationsService.js';

async function callTool(name, args = {}) {
  return request(app)
    .post('/api/realtime/tool-call')
    .send({ callId: `call_${name}`, name, arguments: JSON.stringify(args) });
}

describe('UTB catalog, Visit Schedule MCP tools & UI redirect actions', () => {
  beforeEach(() => {
    accommodationsService._resetRuntimeBookingsForTesting();
  });

  it('GET /api/accommodations?campusId=utb mengembalikan kos sekitar Universitas Teknologi Bandung', async () => {
    const res = await request(app).get('/api/accommodations?campusId=utb');
    expect(res.status).toBe(200);
    const items = res.body.data;
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(items.every((k) => k.campusId === 'utb')).toBe(true);
  });

  it('pencarian bahasa alami "kos dekat UTB Soekarno-Hatta" diprioritaskan ke kampus UTB', async () => {
    const res = await callTool('teralio_search_accommodations', {
      query: 'kos dekat UTB Soekarno-Hatta',
    });
    expect(res.status).toBe(200);
    const result = res.body.data.result;
    expect(result.returnedCount).toBeGreaterThan(0);
    expect(result.accommodations[0].campusId).toBe('utb');
    expect(result.uiAction).toMatchObject({ type: 'focus_map', nav: 'discovery' });
  });

  it('teralio_get_current_datetime & teralio_focus_map_location mengembalikan konteks WIB dan aksi fokus peta', async () => {
    const dt = await callTool('teralio_get_current_datetime');
    expect(dt.status).toBe(200);
    expect(dt.body.data.ok).toBe(true);
    expect(dt.body.data.result.todayIso).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const focus = await callTool('teralio_focus_map_location', { query: 'UTB' });
    expect(focus.status).toBe(200);
    expect(focus.body.data.result.uiAction.type).toBe('focus_map');
    expect(focus.body.data.result.uiAction.targetKos.campusId).toBe('utb');
  });

  it('membuat lalu menjadwal ulang janji temu via tool dengan aksi redirect ke Visit Schedule', async () => {
    const created = await callTool('teralio_create_visit_schedule', {
      accommodationId: 'kos-utb-1',
      visitDate: 'besok',
      visitTime: 'jam 2 siang',
    });
    expect(created.status).toBe(200);
    const createdResult = created.body.data.result;
    expect(createdResult.booking.accommodationId).toBe('kos-utb-1');
    expect(createdResult.booking.scheduledTime).toBe('14:00 WIB');
    expect(createdResult.uiAction).toMatchObject({
      type: 'open_schedule',
      nav: 'schedule',
      highlightBookingId: createdResult.booking.id,
    });

    const updated = await callTool('teralio_update_visit_schedule', {
      bookingId: createdResult.booking.id,
      newTime: '16:30',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.result.booking.scheduledTime).toBe('16:30 WIB');
    expect(updated.body.data.result.booking.status).toBe('Diubah');
    expect(updated.body.data.result.uiAction.type).toBe('open_schedule');

    const list = await request(app).get('/api/accommodations/bookings');
    expect(list.body.data[0].scheduledTime).toBe('16:30 WIB');
  });
});
