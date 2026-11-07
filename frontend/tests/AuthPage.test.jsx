import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AuthPage from '../pages/AuthPage.jsx';

describe('Teralio AuthPage (Sign Up & Log In)', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('merender layout 2 kolom Sign Up dengan video hero, 3 fase step, dan elemen form', () => {
    render(<AuthPage initialMode="signup" />);

    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    const heroVideo = screen.getByTestId('auth-hero-video');
    const source = heroVideo.querySelector('source');
    expect(source).toHaveAttribute(
      'src',
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4'
    );

    expect(screen.getByText('Join Teralio')).toBeInTheDocument();
    expect(screen.getByText('Register your identity')).toBeInTheDocument();
    expect(screen.getByText('Configure your studio')).toBeInTheDocument();
    expect(screen.getByText('Finalize your profile')).toBeInTheDocument();

    expect(screen.getByText('Create New Profile')).toBeInTheDocument();
    expect(screen.getByTestId('social-btn-google')).toBeInTheDocument();
    expect(screen.getByTestId('social-btn-github')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Requires at least 8 symbols.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('mendukung toggle visibilitas password dan validasi minimal 8 karakter', async () => {
    render(<AuthPage initialMode="signup" />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByTestId('toggle-password-btn'));
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'student@teralio.com' },
    });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    expect(await screen.findByTestId('auth-status-banner')).toHaveTextContent(/8 (karakter|symbols)/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('mengirim payload registrasi ke /api/auth/register dan memperbarui sesi', async () => {
    const onAuthSuccess = vi.fn();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Registrasi berhasil',
        data: {
          user: { id: 'usr-1', email: 'arief@teralio.com', fullName: 'Arief Pratama' },
          session: { accessToken: 'jwt-123' },
        },
      }),
    });

    render(<AuthPage initialMode="signup" onAuthSuccess={onAuthSuccess} />);

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Arief' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Pratama' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'arief@teralio.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'arief@teralio.com',
            password: 'password123',
            fullName: 'Arief Pratama',
          }),
        })
      );
    });

    expect(await screen.findByTestId('auth-status-banner')).toHaveTextContent(
      /Registrasi berhasil/i
    );
    expect(onAuthSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'arief@teralio.com' })
    );
  });

  it('dapat berpindah ke mode Login dan memanggil /api/auth/login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Login berhasil',
        data: {
          user: { id: 'usr-mock-1', email: 'test@teralio.com', fullName: 'Mahasiswa Test' },
          session: { accessToken: 'mock-jwt' },
        },
      }),
    });

    render(<AuthPage initialMode="signup" />);

    fireEvent.click(screen.getByTestId('switch-to-login-btn'));
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@teralio.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({ method: 'POST' })
      );
    });

    expect(await screen.findByTestId('auth-status-banner')).toHaveTextContent(/Login berhasil/i);
  });
});
