import React, { useState, useEffect } from 'react';
import { Link, useRouter } from '../context/RouterContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { BRAND, NAV_LINKS } from '../data/teralioData.js';
import BrandLogo from './BrandLogo.jsx';
import { MenuIcon, CloseIcon, SunIcon, MoonIcon, ArrowRightIcon } from './Icons.jsx';

export function MobileNavDrawer({ open, onClose }) {
  const { pathname } = useRouter();
  const { isNight, pickTimeOfDay } = useTheme();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="mobile-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
    >
      <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-drawer__top">
          <Link to="/" className="site-brand" onClick={onClose}>
            <BrandLogo />
            <span>{BRAND.name}</span>
          </Link>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close navigation">
            <CloseIcon />
          </button>
        </div>

        <div className="mode-pill" role="group" aria-label="Mobile theme toggle">
          <button
            type="button"
            className={`mode-pill__btn ${!isNight ? 'is-active' : ''}`}
            aria-pressed={!isNight}
            onClick={() => pickTimeOfDay(0)}
          >
            <SunIcon />
            <span>Light</span>
          </button>
          <button
            type="button"
            className={`mode-pill__btn ${isNight ? 'is-active' : ''}`}
            aria-pressed={isNight}
            onClick={() => pickTimeOfDay(1)}
          >
            <MoonIcon />
            <span>Dark</span>
          </button>
        </div>

        <ul className="mobile-drawer__links">
          <li>
            <Link to="/" className={pathname === '/' ? 'is-active' : ''} onClick={onClose}>
              <span>Home</span>
              <ArrowRightIcon />
            </Link>
          </li>
          {NAV_LINKS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={pathname === item.to ? 'is-active' : ''}
                onClick={onClose}
              >
                <span>{item.label}</span>
                <ArrowRightIcon />
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/customers"
              className={pathname === '/customers' ? 'is-active' : ''}
              onClick={onClose}
            >
              <span>Customers Portal</span>
              <ArrowRightIcon />
            </Link>
          </li>
          <li>
            <Link
              to="/signup"
              className={pathname === '/signup' || pathname === '/login' ? 'is-active' : ''}
              onClick={onClose}
            >
              <span>Create Account / Sign In</span>
              <ArrowRightIcon />
            </Link>
          </li>
        </ul>

        <div className="mobile-drawer__cta-stack">
          <Link to="/quote" className="btn-pill btn-pill--lg btn-pill--full" onClick={onClose}>
            <span>Get an Instant Quote</span>
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Header = ({ floating = false, visible = true }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useRouter();
  const { isNight, pickTimeOfDay } = useTheme();

  const headerClass = [
    'site-header',
    floating ? 'site-header--floating' : '',
    floating && visible ? 'is-visible' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <header className={headerClass} data-testid="header-component">
        <div className="site-header__inner">
          <Link to="/" className="site-brand" aria-label={`${BRAND.name} Home`}>
            <BrandLogo />
            <span>{BRAND.name}</span>
          </Link>

          <ul className="site-nav">
            {NAV_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="site-nav__link" activeClassName="is-active">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="site-actions">
            <div className="mode-pill" role="group" aria-label="Theme mode">
              <button
                type="button"
                className={`mode-pill__btn ${!isNight ? 'is-active' : ''}`}
                aria-pressed={!isNight}
                onClick={() => pickTimeOfDay(0)}
              >
                <SunIcon />
                <span>Light</span>
              </button>
              <button
                type="button"
                className={`mode-pill__btn ${isNight ? 'is-active' : ''}`}
                aria-pressed={isNight}
                onClick={() => pickTimeOfDay(1)}
              >
                <MoonIcon />
                <span>Dark</span>
              </button>
            </div>

            <Link
              to="/customers"
              className={`site-secondary-link ${pathname === '/customers' ? 'is-active' : ''}`}
            >
              Customers
            </Link>

            <Link
              to="/signup"
              className={`site-secondary-link ${
                pathname === '/signup' || pathname === '/login' ? 'is-active' : ''
              }`}
            >
              Sign Up
            </Link>

            <Link to="/quote" className="btn-pill">
              Get an Instant Quote
            </Link>

            <button
              type="button"
              className="mobile-menu-trigger"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

export default Header;
