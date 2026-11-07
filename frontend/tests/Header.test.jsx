import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import Header from '../components/Header.jsx';
import { AtmosphereProvider } from '../context/AtmosphereContext.jsx';
import { RouterProvider } from '../context/RouterContext.jsx';

describe('Teralio Unified Header', () => {
  it('merender satu header seragam lengkap dengan navigasi, tombol ganti tema, dan tombol Get Started', () => {
    render(
      <AtmosphereProvider>
        <RouterProvider initialPath="/">
          <Header />
        </RouterProvider>
      </AtmosphereProvider>
    );

    const header = screen.getByTestId('header-component');
    expect(header).toHaveClass('unified-header');
    expect(within(header).getByText('Teralio')).toBeInTheDocument();

    expect(within(header).getByText('How It Works')).toHaveAttribute('href', '/how-it-works');
    expect(within(header).getByText('Our Cases')).toHaveAttribute('href', '/cases');
    expect(within(header).getByText('Pricing')).toHaveAttribute('href', '/pricing');
    expect(within(header).getByText('Customers')).toHaveAttribute('href', '/customers');
    expect(within(header).getByText('FAQ')).toHaveAttribute('href', '/resources');
    expect(within(header).queryByText('About Us')).not.toBeInTheDocument();

    // Tombol ganti tema (Morning / Night) di header
    const themeSwitch = within(header).getByTestId('header-theme-toggle');
    expect(themeSwitch).toBeInTheDocument();
    const morningThemeBtn = within(themeSwitch).getByRole('button', { name: /Morning/i });
    const nightThemeBtn = within(themeSwitch).getByRole('button', { name: /Night/i });
    expect(nightThemeBtn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(morningThemeBtn);
    expect(morningThemeBtn).toHaveAttribute('aria-pressed', 'true');

    // Tombol Get Started
    const getStartedBtn = within(header).getByTestId('header-get-started-btn');
    expect(getStartedBtn).toBeInTheDocument();
    expect(getStartedBtn).toHaveTextContent('Get Started');
  });
});
