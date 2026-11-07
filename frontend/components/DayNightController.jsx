import React, { useState } from 'react';
import { HOURLY_PROFILES, MEDIA_ASSETS } from '../data/teralioData.js';
import { useTheme } from '../context/ThemeContext.jsx';

const PLAYHEAD_X = {
  dawn: 82,
  midday: 198,
  dusk: 312,
  midnight: 386,
};

const PLAYHEAD_SOLAR_Y = {
  dawn: 56,
  midday: 12,
  dusk: 66,
  midnight: 76,
};

export function DayNightController() {
  const [selectedId, setSelectedId] = useState('dusk');
  const { pickTimeOfDay } = useTheme();

  const current = HOURLY_PROFILES.find((p) => p.id === selectedId) || HOURLY_PROFILES[2];
  const markerX = PLAYHEAD_X[current.id] || 312;
  const markerY = PLAYHEAD_SOLAR_Y[current.id] || 66;

  const handleSelectProfile = (profile) => {
    setSelectedId(profile.id);
    pickTimeOfDay(profile.isNightMode ? 1 : 0);
  };

  return (
    <div className="controller-shell">
      <div className="stack-md">
        <div>
          <span className="eyebrow">02 — Autonomous Smart Controller</span>
          <h3 className="section-title section-title--md">
            24-Hour Dispatch &amp; Tariff Arbitrage
          </h3>
          <p className="card-body">
            Select a dispatch window to inspect how Teralio harvests diffused morning photons,
            banks midday solar, and sells evening peak surges to underwrite your $0 bill.
          </p>
        </div>

        <div className="time-tabs" role="tablist" aria-label="24-hour dispatch simulator">
          {HOURLY_PROFILES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === current.id}
              className={`time-tab ${p.id === current.id ? 'is-active' : ''}`}
              onClick={() => handleSelectProfile(p)}
            >
              <strong>{p.time}</strong>
              <span>{p.period}</span>
            </button>
          ))}
        </div>

        {/* Precision SVG Solar Irradiance vs. Wholesale Spot Price Curve */}
        <div className="curve-chart-box">
          <div className="curve-chart-legend tabular">
            <span>Solar Curve (kW) vs. Grid Tariff ($/kWh)</span>
            <span>Active Window: {current.time}</span>
          </div>
          <svg
            viewBox="0 0 420 84"
            className="curve-chart-svg"
            aria-label="24-hour solar harvest and grid tariff curve"
          >
            <line x1="0" y1="76" x2="420" y2="76" stroke="var(--line)" strokeWidth="1" />
            <line
              x1="0"
              y1="40"
              x2="420"
              y2="40"
              stroke="var(--line)"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
            {/* Wholesale Spot Price Curve (dashed) */}
            <path
              d="M 8 64 C 65 56, 130 72, 198 71 C 258 70, 286 16, 320 18 C 355 20, 388 58, 412 62"
              fill="none"
              stroke="var(--muted)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            {/* Solar Generation Bell Curve (solid accent) */}
            <path
              d="M 8 76 C 55 76, 75 58, 115 36 C 155 14, 180 10, 200 12 C 228 14, 275 56, 322 72 C 355 76, 390 76, 412 76"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.2"
            />
            {/* Active Time Playhead */}
            <line
              x1={markerX}
              y1="6"
              x2={markerX}
              y2="76"
              stroke="var(--ink)"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
            <circle cx={markerX} cy={markerY} r="4.5" fill="var(--accent)" stroke="var(--bg-card-solid)" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="telemetry-grid">
          <div className="telemetry-box">
            <div className="telemetry-box__label">Solar Roof Output</div>
            <div className="telemetry-box__val">{current.solarKw.toFixed(1)} kW</div>
          </div>
          <div className="telemetry-box">
            <div className="telemetry-box__label">Farmhouse Load</div>
            <div className="telemetry-box__val">{current.homeKw.toFixed(1)} kW</div>
          </div>
          <div className="telemetry-box">
            <div className="telemetry-box__label">Grid Spot Tariff</div>
            <div className="telemetry-box__val">{current.spotPrice}</div>
          </div>
          <div className="telemetry-box">
            <div className="telemetry-box__label">Net Homeowner Bill</div>
            <div className="telemetry-box__val telemetry-box__val--highlight">
              {current.netBill}
            </div>
          </div>
        </div>

        <p className="card-body">{current.summary}</p>
      </div>

      <div className="visual-house-preview">
        <img
          src={MEDIA_ASSETS.hero.groundMorning}
          alt="Farmhouse daytime solar harvest"
          className={!current.isNightMode ? 'is-visible' : ''}
        />
        <img
          src={MEDIA_ASSETS.hero.groundNight}
          alt="Farmhouse evening stored energy dispatch"
          className={current.isNightMode ? 'is-visible' : ''}
        />

        <div className="visual-house-overlay">
          <span className="visual-pill">
            {current.time} &bull; {current.period}
          </span>
          <span className="visual-pill">{current.gridAction}</span>
        </div>

        <div className="visual-house-bottom">
          <div className="flex-between">
            <span>Teralio LFP Vault Charge</span>
            <strong className="tabular">{current.batteryPct}%</strong>
          </div>
          <div className="battery-bar">
            <div
              className="battery-bar__fill"
              style={{ '--fill-pct': `${current.batteryPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayNightController;
