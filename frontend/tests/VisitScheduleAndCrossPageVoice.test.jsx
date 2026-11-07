import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import DashboardPage from '../pages/DashboardPage.jsx';
import VisitScheduleView from '../components/schedule/VisitScheduleView.jsx';

const BOOKING = {
  id: 'booking-utb-1',
  accommodationId: 'kos-utb-1',
  accommodationName: 'Soekarno Hatta 378 Student Residence',
  address: 'Jl. Soekarno-Hatta, Kebon Lega, Bandung',
  ownerName: 'Ibu Rina',
  contactPhone: '0812-0000-0000',
  scheduledIso: '2026-11-09',
  scheduledTime: '14:00 WIB',
  scheduledLabel: 'Senin, 9 November 2026 • 14:00 WIB',
  status: 'Terjadwal',
};

const UTB_KOS = {
  id: 'kos-utb-1',
  campusId: 'utb',
  campusName: 'Universitas Teknologi Bandung (UTB)',
  name: 'Soekarno Hatta 378 Student Residence',
  address: 'Jl. Soekarno-Hatta, Kebon Lega, Bandung',
  lat: -6.9475,
  lng: 107.6022,
  price: 'Rp1.300.000 / bln',
  distance: '200m dari Kampus',
  type: 'Putra / Putri',
};

function mockFetch() {
  global.fetch = vi.fn(async (url, opts = {}) => {
    if (url === '/api/accommodations/bookings' && (!opts.method || opts.method === 'GET')) {
      return { ok: true, json: async () => ({ success: true, data: [BOOKING] }) };
    }
    if (typeof url === 'string' && url.startsWith('/api/accommodations/bookings/') && opts.method === 'PATCH') {
      const body = JSON.parse(opts.body || '{}');
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...BOOKING,
            scheduledIso: body.newDate || BOOKING.scheduledIso,
            scheduledTime: body.newTime || BOOKING.scheduledTime,
            scheduledLabel: `Jadwal baru • ${body.newTime}`,
            status: 'Diubah',
          },
        }),
      };
    }
    if (url === '/api/accommodations/datetime') {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: { todayLabel: 'Sabtu, 7 November 2026', currentTimeWib: '14:00 WIB' },
        }),
      };
    }
    if (url === '/api/accommodations') {
      return { ok: true, json: async () => ({ success: true, data: [UTB_KOS] }) };
    }
    return { ok: true, json: async () => ({ success: true, data: [] }) };
  });
}

describe('Visit Schedule (Kalender + Janji Temu) & Cross-Page Voice AI', () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch();
  });

  it('menampilkan kalender bulanan, menandai tanggal booking, dan mendukung ubah jam janji temu inline', async () => {
    const onBookingsChange = vi.fn();
    render(
      <VisitScheduleView
        bookings={[BOOKING]}
        accommodations={[UTB_KOS]}
        initialSelectedDate="2026-11-09"
        highlightBookingId="booking-utb-1"
        onBookingsChange={onBookingsChange}
      />,
    );

    expect(screen.getByTestId('visit-schedule-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-day-2026-11-09')).toHaveClass('has-booking');
    expect(screen.getByTestId('calendar-day-2026-11-09')).toHaveClass('is-selected');
    expect(screen.getByTestId('booking-card-booking-utb-1')).toHaveClass('is-highlighted');

    fireEvent.click(screen.getByTestId('reschedule-btn-booking-utb-1'));
    expect(screen.getByTestId('reschedule-panel-booking-utb-1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('16:00 WIB'));
    fireEvent.click(screen.getByTestId('save-reschedule-btn-booking-utb-1'));

    await waitFor(() => {
      expect(onBookingsChange).toHaveBeenCalled();
    });
    const updatedList = onBookingsChange.mock.calls[0][0];
    expect(updatedList[0].scheduledTime).toBe('16:00 WIB');
    expect(updatedList[0].status).toBe('Diubah');
  });

  it('halaman Visit Schedule di Dashboard memakai kalender baru dan Voice AI bisa dibuka lintas halaman', async () => {
    render(<DashboardPage user={{ fullName: 'Andreas' }} />);

    fireEvent.click(screen.getByTestId('nav-item-schedule'));
    expect(screen.getByTestId('subview-schedule')).toBeInTheDocument();
    expect(screen.getByTestId('visit-schedule-calendar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('booking-card-booking-utb-1')).toBeInTheDocument();
    });

    // Tombol Voice AI melayang tersedia di halaman non-peta
    const fab = screen.getByTestId('crosspage-voice-fab');
    fireEvent.click(fab);

    expect(screen.getByTestId('smart-kos-ai-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('smart-kos-voice-overlay')).toBeInTheDocument();
    expect(screen.queryByText(/Supabase Ready/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('crosspage-voice-fab')).not.toBeInTheDocument();

    // Selesaikan conversation -> overlay suara tertutup, halaman tetap di Visit Schedule
    fireEvent.click(screen.getByTestId('smart-kos-voice-close-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('smart-kos-voice-overlay')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('subview-schedule')).toBeInTheDocument();
  });
});
