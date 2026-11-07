import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';

describe('TERALIO Dashboard Page & Collapsible Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn((url) => {
      if (url === '/api/items') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'kos-test-1',
                name: 'Kos Harmoni Sukapura',
                price: 'Rp1.250.000 / bln',
                distance: '650m dari Kampus',
                features: ['Kamar Mandi Dalam', 'Wi-Fi 100 Mbps'],
              },
            ],
          }),
        });
      }
      if (url === '/api/health') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok', service: 'Teralio Express Backend' }),
        });
      }
      if (url === '/api/auth/login') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Login berhasil',
            data: {
              user: { id: 'usr-99', email: 'andreas@teralio.com', fullName: 'Andreas Wijaya' },
              session: { accessToken: 'jwt-mock-token' },
            },
          }),
        });
      }
      if (url === '/api/maps/status') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { service: 'Google Maps Platform', configured: false },
          }),
        });
      }
      if (typeof url === 'string' && url.startsWith('/api/maps/places/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              source: 'google_maps_places_text_search',
              places: [
                {
                  id: 'gplace-dago-1',
                  name: 'Kos Dago Asri Residence',
                  shortAddress: 'Jl. Dago Asri No. 9, Bandung',
                  location: { lat: -6.8851, lng: 107.6135 },
                  rating: 4.9,
                  userRatingCount: 42,
                },
              ],
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    });
  });

  it('merender Dashboard lengkap dengan greeting, topbar, dan 5 kartu Bento', async () => {
    render(<DashboardPage user={{ fullName: 'Andreas', email: 'andreas@teralio.com' }} />);

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-topbar')).toBeInTheDocument();
    expect(screen.getByText(/Hi, Andreas!/i)).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('upgrade-btn')).toBeInTheDocument();

    // 5 Bento Cards
    expect(screen.getByTestId('hero-bento-card')).toBeInTheDocument();
    expect(screen.getByTestId('match-status-card')).toBeInTheDocument();
    expect(screen.getByTestId('curated-kos-card')).toBeInTheDocument();
    expect(screen.getByTestId('budget-meter-card')).toBeInTheDocument();
    expect(screen.getByTestId('proximity-wave-card')).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/items');
    });
  });

  it('mendukung fitur minimize dan extend pada sidebar navigasi', () => {
    render(<DashboardPage />);

    const sidebar = screen.getByTestId('dashboard-sidebar');
    const toggleBtn = screen.getByTestId('sidebar-toggle-btn');
    const dockToggleBtn = screen.getByTestId('sidebar-dock-toggle-btn');

    // Default initial: minimized (86px rail)
    expect(sidebar).toHaveClass('is-minimized');
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Klik tombol toggle di ujung sidebar -> extend (258px)
    fireEvent.click(toggleBtn);
    expect(sidebar).toHaveClass('is-expanded');
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    // Klik tombol dock toggle di bagian bawah -> minimize kembali
    fireEvent.click(dockToggleBtn);
    expect(sidebar).toHaveClass('is-minimized');
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('mendukung interaksi widget: carousel kos, tabs periode, dan modal AI', async () => {
    render(<DashboardPage />);

    // 1. Carousel Kos Spotlight
    expect(screen.getByTestId('curated-counter')).toHaveTextContent('2/5');
    const nextBtn = screen.getByTestId('curated-next-btn');
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('curated-counter')).toHaveTextContent('3/5');

    // 2. Period Tabs D / W / M
    const tabM = screen.getByTestId('period-tab-M');
    fireEvent.click(tabM);
    expect(tabM).toHaveClass('is-active');

    // 3. Membuka halaman Chat terpadu dengan Fullscreen Voice Conversation saat klik Explore Now di hero banner
    const exploreBtn = screen.getByTestId('hero-explore-btn');
    fireEvent.click(exploreBtn);
    expect(screen.getByTestId('teralio-chat-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('fullscreen-voice-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('voice-start-btn')).toHaveTextContent('Start Conversation');

    // Menutup Fullscreen Voice kembali ke halaman Chat minimalis
    fireEvent.click(screen.getByTestId('voice-close-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('fullscreen-voice-overlay')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('chat-empty-headline')).toHaveTextContent(
      'Sebaiknya kita mulai dari mana?'
    );
  });

  it('berpindah ke subview Smart Kos Match berbasis Google Maps interaktif dan kembali ke overview', async () => {
    render(<DashboardPage />);

    // Klik menu Smart Kos Match (discovery)
    fireEvent.click(screen.getByTestId('nav-item-discovery'));
    expect(screen.getByTestId('subview-discovery')).toBeInTheDocument();
    expect(screen.getByText('Smart Kos Match & Listings')).toBeInTheDocument();

    // Verifikasi tampilan utama adalah Google Maps interaktif dengan default mode Satelit (&t=h)
    expect(screen.getByTestId('smart-kos-google-map')).toBeInTheDocument();
    const gmapsIframe = screen.getByTestId('google-maps-iframe');
    expect(gmapsIframe).toBeInTheDocument();
    expect(gmapsIframe.getAttribute('src')).toContain('maps.google.com/maps');
    expect(gmapsIframe.getAttribute('src')).toContain('&t=h');
    expect(screen.getByTestId('map-type-satellite')).toHaveClass('is-active');

    // Pengguna dapat mengganti ke mode Peta (Roadmap)
    fireEvent.click(screen.getByTestId('map-type-roadmap'));
    expect(screen.getByTestId('google-maps-iframe').getAttribute('src')).toContain('&t=m');

    // Verifikasi bahwa elemen yang diminta dihapus sudah tidak ada di DOM:
    expect(screen.queryByTestId('google-maps-search-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('google-maps-search-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('map-selected-kos-card')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Pin Kos Cepat di Peta')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: /Pilih Kampus/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /Filter kriteria kos/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('toggle-kos-drawer-btn')).not.toBeInTheDocument();
    expect(screen.queryByText(/Sebaiknya kita mulai dari mana\?/i)).not.toBeInTheDocument();

    // Verifikasi bahwa Chat AI di bagian bawah tengah hadir bersih dan responsif
    expect(screen.getByTestId('chat-composer')).toBeInTheDocument();
    expect(screen.getByTestId('chat-composer-input')).toBeInTheDocument();
    expect(screen.getByTestId('composer-plus-btn')).toBeInTheDocument();
    expect(screen.getByTestId('composer-thinking-toggle')).toBeInTheDocument();

    // Kirim prompt ke Chat AI di bawah peta -> memunculkan kartu rekomendasi AI
    fireEvent.change(screen.getByTestId('chat-composer-input'), {
      target: { value: 'Cari kos putri kamar mandi dalam' },
    });
    fireEvent.click(screen.getByTestId('composer-send-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('fullmap-ai-reply')).toBeInTheDocument();
      expect(screen.getByText(/TERALIO AI/i)).toBeInTheDocument();
    });

    // Kembali ke Overview melalui menu navigasi sidebar
    fireEvent.click(screen.getByTestId('nav-item-home'));
    expect(screen.getByTestId('hero-bento-card')).toBeInTheDocument();
  });

  it('otomatis redirect ke halaman Dashboard ketika user berhasil login', async () => {
    render(<App initialPath="/login" />);

    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();

    // Isi email & password
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'andreas@teralio.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    // Submit login form
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    // Verifikasi otomatis redirect ke DashboardPage dengan data user
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    expect(screen.getByText(/Hi, Andreas!/i)).toBeInTheDocument();
    expect(screen.getByTestId('hero-bento-card')).toBeInTheDocument();
  });
});
