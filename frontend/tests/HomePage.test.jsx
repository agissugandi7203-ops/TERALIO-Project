import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import App from '../App.jsx';

describe('Teralio Single-Page Landing Page & Unified Header', () => {
  it('merender satu landing page utuh dengan hero Lumen Roof dan seluruh seksi terpadu', () => {
    render(<App initialPath="/" />);

    // Hanya ada 1 elemen header
    const headers = screen.getAllByTestId('header-component');
    expect(headers).toHaveLength(1);
    const headerNode = headers[0];

    // Hero headline Teralio
    expect(screen.getByText('Cari Kos Cerdas')).toBeInTheDocument();
    expect(within(headerNode).getByTestId('header-get-started-btn')).toBeInTheDocument();
    expect(within(headerNode).getByTestId('header-theme-toggle')).toBeInTheDocument();

    // Seluruh seksi terpadu dalam satu halaman
    expect(screen.getByTestId('how-it-works-page')).toBeInTheDocument();
    expect(screen.getByTestId('our-cases-page')).toBeInTheDocument();
    expect(screen.queryByTestId('about-us-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('customers-page')).toBeInTheDocument();
    expect(screen.getByTestId('resources-page')).toBeInTheDocument();
    expect(screen.getByTestId('careers-page')).toBeInTheDocument();
  });

  it('mendukung navigasi smooth scroll antar seksi melalui link header dan tombol Get Started', () => {
    const scrollSpy = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollSpy;

    render(<App initialPath="/" />);
    const header = screen.getByTestId('header-component');

    // Klik navigasi header
    fireEvent.click(within(header).getByText('How It Works'));
    expect(scrollSpy).toHaveBeenCalled();

    fireEvent.click(within(header).getByText('Our Cases'));
    expect(scrollSpy).toHaveBeenCalled();

    fireEvent.click(within(header).getByText('Pricing'));
    expect(scrollSpy).toHaveBeenCalled();

    fireEvent.click(within(header).getByText('Customers'));
    expect(scrollSpy).toHaveBeenCalled();

    fireEvent.click(within(header).getByText('FAQ'));
    expect(scrollSpy).toHaveBeenCalled();

    // Klik tombol Get Started
    fireEvent.click(within(header).getByTestId('header-get-started-btn'));
    expect(scrollSpy).toHaveBeenCalled();
  });

  it('tetap mendukung navigasi langsung ke rute autentikasi terpisah', () => {
    render(<App initialPath="/login" />);
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
  });

  it('mendukung interaksi accordion FAQ dengan animasi buka tutup dan state tema adaptif', () => {
    render(<App initialPath="/" />);

    const faqSection = screen.getByTestId('resources-page');
    expect(faqSection).toBeInTheDocument();

    // Pastikan pertanyaan pertama terbuka secara default
    const firstQuestion = screen.getByText('Bagaimana cara Teralio membantu mahasiswa mencari kos?');
    const firstButton = firstQuestion.closest('[role="button"]');
    expect(firstButton).toHaveAttribute('aria-expanded', 'true');

    // Klik pertanyaan kedua untuk membuka
    const secondQuestion = screen.getByText('Apa itu Budget Intelligence dan bagaimana cara perhitungannya?');
    const secondButton = secondQuestion.closest('[role="button"]');
    expect(secondButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(secondButton);
    expect(secondButton).toHaveAttribute('aria-expanded', 'true');
    expect(firstButton).toHaveAttribute('aria-expanded', 'false');

    // Klik kembali pertanyaan kedua untuk menutup (toggle close)
    fireEvent.click(secondButton);
    expect(secondButton).toHaveAttribute('aria-expanded', 'false');
  });
});
