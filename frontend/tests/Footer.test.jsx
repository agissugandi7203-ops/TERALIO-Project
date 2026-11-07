import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Footer from '../components/Footer.jsx';

describe('Teralio Footer Component', () => {
  it('merender kartu video kiri, identitas Teralio, dan ikon sosial media', () => {
    render(<Footer />);

    expect(screen.getByTestId('footer-section')).toBeInTheDocument();
    const video = screen.getByTestId('footer-video');
    const source = video.querySelector('source');
    expect(source).toHaveAttribute(
      'src',
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4'
    );

    expect(screen.getAllByText('Teralio').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Smarter living discovery/i)).toBeInTheDocument();
    expect(screen.getByText(/powered by AI\./i)).toBeInTheDocument();
    expect(screen.getByText('Stay in touch!')).toBeInTheDocument();

    expect(screen.getByLabelText('Discord')).toBeInTheDocument();
    expect(screen.getByLabelText('X (Twitter)')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
  });

  it('merender kolom navigasi, badge Feeling lucky?, watermark SVG, dan form subscribe', () => {
    render(<Footer />);

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Testimonials')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Terms and Condition')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Feeling lucky?')).toBeInTheDocument();
    expect(screen.getByTestId('footer-watermark')).toBeInTheDocument();

    const input = screen.getByTestId('footer-subscribe-input');
    const btn = screen.getByTestId('footer-subscribe-btn');

    fireEvent.change(input, { target: { value: 'hello@teralio.com' } });
    fireEvent.click(btn);

    expect(screen.getByTestId('footer-subscribe-feedback')).toBeInTheDocument();
  });
});
