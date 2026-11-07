import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Header from '../components/Header.jsx';
import { RouterProvider } from '../context/RouterContext.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';

describe('Teralio Header & Theme Toggle', () => {
  it('renders Teralio brand, navigation links, Sign Up, and Light/Dark theme controls', () => {
    render(
      <ThemeProvider>
        <RouterProvider initialPath="/how-it-works">
          <Header />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(screen.getByText('Teralio')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Our Cases')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Careers')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByText('Get an Instant Quote')).toBeInTheDocument();

    const lightBtn = screen.getByRole('button', { name: /Light/i });
    const darkBtn = screen.getByRole('button', { name: /Dark/i });
    expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
    expect(lightBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(lightBtn);
    expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
    expect(darkBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
