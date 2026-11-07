import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import App from '../App.jsx';

describe('Teralio Multi-Page Navigation & Quote Configurator', () => {
  it('navigates across all primary pages and standalone Auth seamlessly', () => {
    render(<App initialPath="/" />);

    const hero = screen.getByTestId('teralio-fog-hero');
    fireEvent.click(within(hero).getByText('How It Works'));
    expect(screen.getByTestId('how-it-works-page')).toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId('header-component')).getByText('Our Cases'));
    expect(screen.getByTestId('our-cases-page')).toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId('header-component')).getByText('About Us'));
    expect(screen.getByTestId('about-us-page')).toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId('header-component')).getByText('Careers'));
    expect(screen.getByTestId('careers-page')).toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId('header-component')).getByText('Resources'));
    expect(screen.getByTestId('resources-page')).toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId('header-component')).getByText('Customers'));
    expect(screen.getByTestId('customers-page')).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByTestId('header-component')).getByText('Get an Instant Quote')
    );
    expect(screen.getByTestId('quote-page')).toBeInTheDocument();

    fireEvent.click(within(screen.getByTestId('header-component')).getByText('Sign Up'));
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
  });

  it('calculates engineered Teralio quote and locks in $0 proposal across steps', () => {
    render(<App initialPath="/quote?bill=320" />);

    expect(screen.getByTestId('quote-page')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Continue to Energy Profile/i));
    fireEvent.click(screen.getByText(/Review & Reserve Guarantee/i));

    fireEvent.change(screen.getByLabelText(/Homeowner Full Name/i), {
      target: { value: 'Maja Lindqvist' },
    });
    fireEvent.change(screen.getByLabelText(/Email for Engineering Dossier/i), {
      target: { value: 'maja@teralio.energy' },
    });
    fireEvent.click(screen.getByText(/Generate Guaranteed \$0 Quote/i));

    expect(screen.getByText(/Your 7-Year \$0 Bill Blueprint is Ready/i)).toBeInTheDocument();
  });
});
