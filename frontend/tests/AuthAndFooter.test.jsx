import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import App from '../App.jsx';

describe('Teralio Dual-Card Video Footer & Two-Column Video Auth', () => {
  it('renders Teralio footer with video card, Feeling lucky cube, Caveat columns, subscribe form, and SVG watermark', () => {
    render(<App initialPath="/about-us" />);

    const footer = screen.getByTestId('teralio-footer');
    expect(within(footer).getByText('Stay in touch!')).toBeInTheDocument();
    expect(within(footer).getByText('Feeling lucky?')).toBeInTheDocument();
    expect(within(footer).getByText('Navigation')).toBeInTheDocument();
    expect(within(footer).getByText('Company')).toBeInTheDocument();
    expect(within(footer).getByText('Stay ahead with Teralio.')).toBeInTheDocument();

    const watermarkText = footer.querySelector('#watermarkText');
    expect(watermarkText).not.toBeNull();
    expect(watermarkText.textContent).toBe('Teralio');

    const videoSource = footer.querySelector('video source');
    expect(videoSource).toHaveAttribute(
      'src',
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4'
    );

    const emailInput = within(footer).getByPlaceholderText('Enter email address');
    fireEvent.change(emailInput, { target: { value: 'hello@teralio.energy' } });
    fireEvent.click(within(footer).getByRole('button', { name: /Subscribe/i }));
    expect(within(footer).getByRole('button', { name: /Subscribed/i })).toBeInTheDocument();
  });

  it('renders two-column Sign Up & Log In interface with video hero, StepItem, SocialButton, InputGroup, and password toggle', () => {
    render(<App initialPath="/signup" />);

    const authPage = screen.getByTestId('auth-page');
    expect(within(authPage).getByText('Join Teralio')).toBeInTheDocument();
    expect(within(authPage).getByText('Create New Profile')).toBeInTheDocument();
    expect(within(authPage).getByText('Register your identity')).toBeInTheDocument();
    expect(within(authPage).getByText('Configure your studio')).toBeInTheDocument();
    expect(within(authPage).getByText('Finalize your profile')).toBeInTheDocument();
    expect(within(authPage).getByText('Requires at least 8 symbols.')).toBeInTheDocument();

    const videoSource = authPage.querySelector('video source');
    expect(videoSource).toHaveAttribute(
      'src',
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4'
    );

    // Password Eye visibility toggle
    const pwdInput = within(authPage).getByLabelText('Password');
    expect(pwdInput).toHaveAttribute('type', 'password');
    fireEvent.click(within(authPage).getByRole('button', { name: /Show password/i }));
    expect(pwdInput).toHaveAttribute('type', 'text');

    // Switch to Login view
    fireEvent.click(within(authPage).getByText('Log in'));
    expect(screen.getByText('Sign In to Teralio')).toBeInTheDocument();
  });
});
