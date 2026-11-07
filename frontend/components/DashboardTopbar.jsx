import React from 'react';

export const DashboardTopbar = ({
  userName = 'Andreas',
  subtitle = "Let's look at your daily accommodation overview.",
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  onOpenMobileMenu,
  onUpgradeClick,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      e.preventDefault();
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <header className="dash-topbar" data-testid="dashboard-topbar">
      <div className="dash-topbar__left">
        <button
          type="button"
          className="mobile-sidebar-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          data-testid="mobile-menu-btn"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>

        <div className="dash-greeting">
          <h1 className="dash-greeting__title">Hi, {userName}!</h1>
          <p className="dash-greeting__subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="dash-topbar__right">
        <label className="dash-search" aria-label="Search accommodation metrics">
          <span className="dash-search__icon" aria-hidden="true">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7.5" />
              <line x1="20" y1="20" x2="16.35" y2="16.35" />
            </svg>
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for kos, campus, or metrics"
            data-testid="dashboard-search-input"
          />
        </label>

        <button
          type="button"
          className="btn-upgrade-pill"
          onClick={onUpgradeClick}
          data-testid="upgrade-btn"
        >
          <span className="btn-upgrade-pill__crown" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v2H3v-2zm0-11l4.5 4L12 5l4.5 6L21 7l-2 9H5L3 7z" />
            </svg>
          </span>
          <span>Upgrade</span>
        </button>
      </div>
    </header>
  );
};

export default DashboardTopbar;
