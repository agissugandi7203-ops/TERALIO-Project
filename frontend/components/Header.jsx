import React, { useEffect, useState, useRef } from 'react';
import { PRIMARY_NAV_LINKS, ROUTES } from '../constants/navigation.js';
import { useAtmosphere } from '../context/AtmosphereContext.jsx';
import { AppLink, useRouter } from '../context/RouterContext.jsx';
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from './Icons.jsx';
import TeralioLogo from './TeralioLogo.jsx';
import { CompactTimeSwitch } from './TimeToggle.jsx';

const NAV_ITEMS = [
  { label: 'How It Works', path: '/how-it-works', sectionId: 'how-it-works' },
  { label: 'Our Cases', path: '/cases', sectionId: 'cases' },
  { label: 'Pricing', path: '/pricing', sectionId: 'pricing' },
  { label: 'Customers', path: '/customers', sectionId: 'customers' },
  { label: 'FAQ', path: '/resources', sectionId: 'faq' },
];

export function Header({ user = null, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const isManualScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const { currentPath, navigate } = useRouter();
  const { isNight, toggleTimeOfDay } = useAtmosphere();

  const isHomeRoute = currentPath === ROUTES.HOME;
  const isElevated = !isHomeRoute || isScrolled;

  const scrollToSection = (sectionId) => {
    setDrawerOpen(false);
    if (typeof window === 'undefined') return;

    // Lock scroll spy while smooth scrolling
    isManualScrollingRef.current = true;
    setActiveSection(sectionId);
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 950);

    if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('');
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', window.location.pathname);
      }
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      const headerClearance = 115; // Memberi jarak lega dan bersih di bawah navigasi header floating 64px
      const elementTop = el.getBoundingClientRect().top;
      const targetY = elementTop + window.pageYOffset - headerClearance;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      });

      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', `#${sectionId}`);
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);

          // Jangan timpa state aktif jika sedang dalam proses smooth-scroll programatik
          if (!isManualScrollingRef.current) {
            if (window.scrollY < 120) {
              setActiveSection('');
            } else {
              // Deteksi seksi aktif berbasis titik pandang fokus (140px di bawah header)
              const focusY = 145;
              let currentMatch = '';
              for (const item of NAV_ITEMS) {
                const el = document.getElementById(item.sectionId);
                if (el) {
                  const rect = el.getBoundingClientRect();
                  if (rect.top <= focusY && rect.bottom > focusY) {
                    currentMatch = item.sectionId;
                    break;
                  }
                }
              }
              if (currentMatch) {
                setActiveSection(currentMatch);
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  return (
    <>
      <header
        className={`unified-header ${isElevated ? 'is-elevated' : 'is-hero-top'}`}
        data-testid="header-component"
      >
        <div className="unified-header-inner">
          <div className="unified-header-brand">
            <TeralioLogo
              className="logo unified-logo"
              onClick={(e) => {
                if (isHomeRoute) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />
          </div>

          <nav className="unified-header-nav" aria-label="Primary navigation">
            <ul className="unified-nav-links">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.sectionId;
                return (
                  <li key={item.sectionId}>
                    <a
                      href={item.path}
                      className={`unified-nav-link ${isActive ? 'is-active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item.sectionId);
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="unified-header-actions">
            {/* Desktop Theme Switcher */}
            <div className="desktop-theme-slot">
              <CompactTimeSwitch />
            </div>

            {/* Compact Mobile Theme Icon Button */}
            <button
              type="button"
              className="mobile-theme-icon-btn"
              onClick={toggleTimeOfDay}
              aria-label={isNight ? 'Switch to Morning theme' : 'Switch to Night theme'}
              title={isNight ? 'Switch to Morning theme' : 'Switch to Night theme'}
            >
              {isNight ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>

            <span className="header-action-divider" aria-hidden="true" />

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <AppLink
                  to={ROUTES.DASHBOARD}
                  className="header-get-started-btn"
                  data-testid="header-dashboard-btn"
                >
                  Dashboard
                </AppLink>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--ink)',
                      opacity: 0.8,
                      cursor: 'pointer',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                    }}
                    data-testid="header-logout-btn"
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <AppLink
                to="/login"
                className="header-get-started-btn"
                data-testid="header-get-started-btn"
              >
                Get Started
              </AppLink>
            )}

            <button
              type="button"
              className="mobile-menu-trigger"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Modern Animated Mobile Navigation Drawer */}
      <div
        className={`mobile-drawer-backdrop ${drawerOpen ? 'is-open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
        data-testid="mobile-drawer-backdrop"
      >
        <nav
          className={`mobile-drawer ${drawerOpen ? 'is-open' : ''}`}
          aria-label="Mobile navigation"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mobile-drawer-top">
            <TeralioLogo
              className="logo mobile-drawer-logo"
              onClick={() => setDrawerOpen(false)}
            />
            <button
              type="button"
              className="mobile-close-btn"
              aria-label="Close navigation menu"
              onClick={() => setDrawerOpen(false)}
            >
              <CloseIcon size={18} />
            </button>
          </div>

          <div className="mobile-drawer-atmosphere">
            <div className="mobile-drawer-label-wrap">
              <span className="mobile-drawer-label">Atmosphere</span>
              <span className="mobile-drawer-sublabel">Day & Night Mode</span>
            </div>
            <CompactTimeSwitch />
          </div>

          <ul className="mobile-drawer-links">
            <li>
              <a
                href="#hero"
                className={`mobile-drawer-link-item ${activeSection === '' ? 'is-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setDrawerOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="mobile-drawer-link-left">
                  <span className="mobile-drawer-link-num">00</span>
                  <span>Home</span>
                </div>
                <span className="mobile-drawer-arrow" aria-hidden="true">›</span>
              </a>
            </li>
            {NAV_ITEMS.map((item, idx) => (
              <li key={item.sectionId}>
                <a
                  href={item.path}
                  className={`mobile-drawer-link-item ${activeSection === item.sectionId ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.sectionId);
                  }}
                >
                  <div className="mobile-drawer-link-left">
                    <span className="mobile-drawer-link-num">0{idx + 1}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className="mobile-drawer-arrow" aria-hidden="true">›</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mobile-drawer-footer">
            {user ? (
              <AppLink
                to={ROUTES.DASHBOARD}
                className="header-get-started-btn full-width-btn"
                onClick={() => setDrawerOpen(false)}
              >
                Go to Dashboard
              </AppLink>
            ) : (
              <AppLink
                to="/login"
                className="header-get-started-btn full-width-btn"
                onClick={() => setDrawerOpen(false)}
              >
                Get Started
              </AppLink>
            )}
            <div className="mobile-drawer-status-pill">
              <span className="mobile-drawer-status-dot" aria-hidden="true" />
              <span>Architectural Solar Roofs • Neural Energy</span>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}

export default Header;
