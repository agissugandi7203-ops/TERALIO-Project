import React from 'react';

export const ProximityWaveCard = ({ onOpenMaps }) => {
  return (
    <article className="white-bento-card" data-testid="proximity-wave-card">
      <div>
        <div className="metric-card__header">
          <div className="metric-card__title-group">
            <span className="metric-icon-chip" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="7 8 3 12 7 16" />
                <polyline points="17 8 21 12 17 16" />
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
            </span>
            <h3 className="metric-card__heading">Campus Walk</h3>
          </div>

          <div className="metric-card__cap">
            100 <small>Mbps</small>
          </div>
        </div>

        <div className="metric-card__subrow">
          <span>Ideal walk range is 300m - 950m</span>
          <span>Fiber Wi-Fi</span>
        </div>
      </div>

      <div className="wave-chart-wrap" aria-hidden="true">
        <svg
          className="wave-chart-svg"
          viewBox="0 0 280 104"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="teralioWaveFill" x1="0" y1="14" x2="0" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6eb6f8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6eb6f8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="teralioPrimaryStroke" x1="8" y1="52" x2="272" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.25" />
              <stop offset="22%" stopColor="#63aef6" stopOpacity="1" />
              <stop offset="78%" stopColor="#63aef6" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="teralioSecondaryStroke" x1="16" y1="56" x2="274" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.18" />
              <stop offset="32%" stopColor="#9bc5ec" stopOpacity="0.85" />
              <stop offset="76%" stopColor="#9bc5ec" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Soft glow area beneath primary wave */}
          <path
            d="M 10 72 C 36 42, 62 20, 88 20 C 122 20, 146 82, 182 82 C 214 82, 236 46, 268 58 L 268 98 L 10 98 Z"
            fill="url(#teralioWaveFill)"
          />

          {/* Secondary phase-shifted wave */}
          <path
            d="M 24 78 C 58 64, 88 30, 122 30 C 156 30, 178 78, 210 78 C 236 78, 252 46, 274 62"
            stroke="url(#teralioSecondaryStroke)"
            strokeWidth="3.6"
            strokeLinecap="round"
          />

          {/* Primary smooth Bezier wave */}
          <path
            d="M 10 72 C 36 42, 62 20, 88 20 C 122 20, 146 82, 182 82 C 214 82, 236 46, 268 58"
            stroke="url(#teralioPrimaryStroke)"
            strokeWidth="4.6"
            strokeLinecap="round"
          />

          {/* Peak indicator dot matching reference */}
          <circle cx="88" cy="20" r="6.5" fill="#63aef6" />
          <circle cx="88" cy="20" r="10.5" fill="#63aef6" fillOpacity="0.18" />
        </svg>
      </div>

      <div className="proximity-footer">
        <div className="proximity-big-number">
          650<span>m</span>
        </div>

        <div className="proximity-status-note">
          Of the campus
          <br />
          radius matched
          <strong>Keep it up!</strong>
          {onOpenMaps && (
            <button
              type="button"
              onClick={onOpenMaps}
              data-testid="open-smart-kos-maps-btn"
              style={{
                marginTop: '0.45rem',
                padding: '0.32rem 0.72rem',
                borderRadius: '999px',
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Buka Google Maps →
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProximityWaveCard;
