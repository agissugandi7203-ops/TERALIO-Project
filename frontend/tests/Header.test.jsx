import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Header from '../components/Header.jsx';

describe('Frontend Header Component', () => {
  it('harus merender judul brand dan badge teknologi', () => {
    render(<Header />);
    expect(screen.getByText(/Teralio Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Vite Frontend/i)).toBeInTheDocument();
    expect(screen.getByText(/Express Backend/i)).toBeInTheDocument();
    expect(screen.getByText(/Supabase Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI Ready/i)).toBeInTheDocument();
  });
});
