import React from 'react';
import { TeralioSunMark } from './TeralioLogo.jsx';

export const TeralioDotMark = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <g fill="#8FA924">
      <circle cx="18" cy="5.5" r="2.1" />
      <circle cx="12.5" cy="11.5" r="2.3" />
      <circle cx="18" cy="11.5" r="2.6" />
      <circle cx="23.5" cy="11.5" r="2.3" />
      <circle cx="6.5" cy="18" r="2.1" />
      <circle cx="12.5" cy="18" r="2.6" />
      <circle cx="18" cy="18" r="3.1" />
      <circle cx="23.5" cy="18" r="2.6" />
      <circle cx="29.5" cy="18" r="2.1" />
      <circle cx="12.5" cy="24.5" r="2.3" />
      <circle cx="18" cy="24.5" r="2.6" />
      <circle cx="23.5" cy="24.5" r="2.3" />
      <circle cx="18" cy="30.5" r="2.1" />
    </g>
  </svg>
);

const NavIcons = {
  home: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-6v6H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
    </svg>
  ),
  discovery: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.3" />
    </svg>
  ),
  chat: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6.5A8 8 0 1 1 21 12z" />
      <line x1="8.5" y1="10.5" x2="15.5" y2="10.5" />
      <line x1="8.5" y1="14" x2="13" y2="14" />
    </svg>
  ),
  schedule: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="16" rx="3.5" />
      <line x1="8" y1="2.8" x2="8" y2="6.2" />
      <line x1="16" y1="2.8" x2="16" y2="6.2" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
      <circle cx="9" cy="14" r="1" fill="currentColor" />
      <circle cx="15" cy="14" r="1" fill="currentColor" />
    </svg>
  ),
  notifications: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8.5-3 8.5h18S18 15 18 8" />
      <path d="M13.73 20a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  dockToggle: (isExpanded) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      {isExpanded ? (
        <>
          <polyline points="10 17 5 12 10 7" />
          <line x1="5" y1="12" x2="16" y2="12" />
        </>
      ) : (
        <>
          <polyline points="11 17 16 12 11 7" />
          <line x1="4" y1="12" x2="16" y2="12" />
        </>
      )}
    </svg>
  ),
  info: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const PRIMARY_ITEMS = [
  { id: 'home', label: 'Dashboard' },
  { id: 'discovery', label: 'Smart Kos' },
  { id: 'chat', label: 'Chat' },
  { id: 'schedule', label: 'Visit Schedule' },
];

const SECONDARY_ITEMS = [
  { id: 'notifications', label: 'Notifications', badge: '3', hasDot: true },
  { id: 'settings', label: 'Preferences' },
];

export const Sidebar = ({
  isExpanded = false,
  onToggleExpand,
  activeNav = 'home',
  onSelectNav,
  mobileOpen = false,
  onCloseMobile,
  user = { fullName: 'User', role: 'Student Member', avatarUrl: '' },
}) => {
  const handleSelect = (id) => {
    if (onSelectNav) onSelectNav(id);
    if (onCloseMobile) onCloseMobile();
  };

  const avatarSrc =
    user?.avatarUrl ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%231e3a8a'/%3E%3Cstop offset='100%25' stop-color='%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' fill='url(%23g)'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%23fde68a'/%3E%3Cpath d='M16 74c3-14 14-22 24-22s21 8 24 22' fill='%23e2e8f0'/%3E%3C/svg%3E";

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`dash-sidebar ${isExpanded ? 'is-expanded' : 'is-minimized'} ${
          mobileOpen ? 'is-mobile-open' : ''
        }`}
        data-testid="dashboard-sidebar"
        aria-label="TERALIO Navigation Sidebar"
      >
        {/* Floating Edge Chevron Button for Minimize / Extend */}
        <button
          type="button"
          className="sidebar-edge-toggle"
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Minimize sidebar' : 'Extend sidebar'}
          aria-expanded={isExpanded}
          data-testid="sidebar-toggle-btn"
          title={isExpanded ? 'Minimize sidebar' : 'Extend sidebar'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isExpanded ? (
              <polyline points="15 18 9 12 15 6" />
            ) : (
              <polyline points="9 18 15 12 9 6" />
            )}
          </svg>
        </button>

        {/* Top Group: Brand Logo + Navigation */}
        <div>
          <div className="sidebar-brand">
            <div className="sidebar-brand__mark">
              <TeralioSunMark className="sidebar-brand__logo-img" />
            </div>
            <div className="sidebar-brand__text">
              <span className="sidebar-brand__name">TERALIO</span>
              <span className="sidebar-brand__tag">AI Living Hub</span>
            </div>
          </div>

          <nav className="sidebar-section" aria-label="Main menu">
            {PRIMARY_ITEMS.map((item) => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-btn ${active ? 'is-active' : ''}`}
                  onClick={() => handleSelect(item.id)}
                  data-tooltip={item.label}
                  data-testid={`nav-item-${item.id}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="sidebar-nav-btn__icon">
                    {NavIcons[item.id](active)}
                  </span>
                  <span className="sidebar-nav-btn__label">{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-nav-btn__badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Group: Notifications, Preferences, Minimize/Extend Dock, User Profile */}
        <div className="sidebar-bottom">
          <div className="sidebar-bottom-actions" aria-label="Utilities">
            {SECONDARY_ITEMS.map((item) => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-btn ${active ? 'is-active' : ''}`}
                  onClick={() => handleSelect(item.id)}
                  data-tooltip={item.label}
                  data-testid={`nav-item-${item.id}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="sidebar-nav-btn__icon">
                    {NavIcons[item.id](active)}
                  </span>
                  <span className="sidebar-nav-btn__label">{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-nav-btn__badge">{item.badge}</span>
                  )}
                  {item.hasDot && !active && (
                    <span className="sidebar-nav-btn__dot" aria-hidden="true" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              className="sidebar-nav-btn"
              onClick={onToggleExpand}
              data-tooltip={isExpanded ? 'Minimize Menu' : 'Extend Menu'}
              data-testid="sidebar-dock-toggle-btn"
              aria-label={isExpanded ? 'Minimize Menu' : 'Extend Menu'}
            >
              <span className="sidebar-nav-btn__icon">
                {NavIcons.dockToggle(isExpanded)}
              </span>
              <span className="sidebar-nav-btn__label">
                {isExpanded ? 'Minimize Menu' : 'Extend Menu'}
              </span>
            </button>
          </div>

          <div
            className="sidebar-profile"
            onClick={() => handleSelect('settings')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleSelect('settings');
            }}
            title={`${user?.fullName || 'User'} — ${user?.email || user?.role || 'Student Member'}`}
            data-testid="sidebar-user-profile"
          >
            <div className="sidebar-avatar-ring">
              <img src={avatarSrc} alt={user?.fullName || 'User'} />
            </div>
            <div className="sidebar-profile__meta">
              <span className="sidebar-profile__name">
                {user?.fullName || 'User'}
              </span>
              <span className="sidebar-profile__role">
                {user?.email || user?.role || 'Student Member'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
