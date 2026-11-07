import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import HomePage from '../pages/HomePage.jsx';

describe('Frontend HomePage', () => {
  beforeEach(() => {
    // Mock global fetch API
    global.fetch = vi.fn((url) => {
      if (url === '/api/health') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'ok',
              service: 'Teralio Express Backend',
              uptime: 120,
            }),
        });
      }
      if (url === '/api/items') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              source: 'test-mock',
              data: [
                { id: '1', title: 'Test Item 1', description: 'Test Desc', category: 'Testing' },
              ],
            }),
        });
      }
      if (url === '/api/openai/status') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                service: 'OpenAI',
                configured: false,
                model: 'gpt-4o-mini',
              },
            }),
        });
      }
      return Promise.reject(new Error(`Unknown url: ${url}`));
    });
  });

  it('harus merender judul hero dan tombol aksi', async () => {
    render(<HomePage />);
    expect(screen.getByText(/Teralio Fullstack Platform/i)).toBeInTheDocument();
    expect(screen.getByTestId('test-backend-btn')).toBeInTheDocument();
    expect(screen.getByTestId('openai-card')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Online \(200 OK\)/i)).toBeInTheDocument();
    });
  });

  it('harus merender item yang diambil dari mock API', async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Desc')).toBeInTheDocument();
    });
  });
});
