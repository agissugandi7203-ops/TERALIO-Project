import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import App from '../App.jsx';

describe('Teralio HomePage & Morning/Night Fog Hero', () => {
  it('starts on Night mode and renders exact Teralio hero headline, caption, and Morning/Night toggle', () => {
    render(<App initialPath="/" />);

    const hero = screen.getByTestId('teralio-fog-hero');
    expect(within(hero).getByText('Teralio')).toBeInTheDocument();
    expect(within(hero).getByText('$0 Electricity Bills')).toBeInTheDocument();
    expect(within(hero).getByText('for the next')).toBeInTheDocument();
    expect(within(hero).getByText('7 Years')).toBeInTheDocument();
    expect(
      within(hero).getByText(/Controller guarantees you get no electricity bill for seven years/i)
    ).toBeInTheDocument();

    const toggleGroup = within(hero).getByRole('group', { name: /Time of day/i });
    const buttons = within(toggleGroup).getAllByRole('button');
    const morningBtn = buttons[0];
    const nightBtn = buttons[1];

    expect(morningBtn).toHaveAttribute('aria-pressed', 'false');
    expect(nightBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(morningBtn);
    expect(morningBtn).toHaveAttribute('aria-pressed', 'true');
    expect(nightBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders Swiss architectural ledger, dispatch curve console, and Teralio footer', () => {
    render(<App initialPath="/" />);

    expect(screen.getByText(/One roofline\. Zero bolt-on racks\./i)).toBeInTheDocument();
    expect(screen.getByText(/24-Hour Dispatch & Tariff Arbitrage/i)).toBeInTheDocument();
    expect(screen.getByTestId('teralio-footer')).toBeInTheDocument();
  });
});
