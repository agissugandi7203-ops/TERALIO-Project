import React from 'react';
import { AppLink } from '../context/RouterContext.jsx';
import { ROUTES } from '../constants/navigation.js';

export function TeralioSunMark({ className = 'teralio-logo-mark-img' }) {
  return (
    <img
      src="/LogoTeralio-trimmed.png"
      alt="Teralio"
      className={className}
      width="34"
      height="34"
    />
  );
}

export function TeralioLogo({ className = 'logo', onClick }) {
  return (
    <AppLink to={ROUTES.HOME} className={className} aria-label="Teralio" onClick={onClick}>
      <TeralioSunMark className="teralio-logo-mark-img" />
      <span>Teralio</span>
    </AppLink>
  );
}

export default TeralioLogo;
