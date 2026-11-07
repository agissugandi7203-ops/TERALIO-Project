import React from 'react';

export const Header = () => {
  return (
    <header className="header" data-testid="header-component">
      <div className="brand">
        <span className="brand-logo">🌌</span>
        <span className="brand-title">Teralio Platform</span>
      </div>
      <div className="header-badges">
        <span className="badge badge-vite">Vite Frontend</span>
        <span className="badge badge-express">Express Backend</span>
        <span className="badge badge-supabase">Supabase Ready</span>
        <span className="badge" style={{ background: '#fef08a', color: '#854d0e' }}>OpenAI Ready</span>
      </div>
    </header>
  );
};

export default Header;
