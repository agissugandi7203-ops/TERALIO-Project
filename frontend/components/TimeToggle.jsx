import React from 'react';
import { useAtmosphere } from '../context/AtmosphereContext.jsx';
import { MoonIcon, SunIcon } from './Icons.jsx';

export function TimeToggle() {
  const { targetMode, selectTimeOfDay } = useAtmosphere();

  return (
    <div className="toggle" role="group" aria-label="Time of day">
      <button
        type="button"
        id="bm"
        aria-pressed={targetMode === 0}
        onClick={() => selectTimeOfDay(0)}
      >
        <b>Morning</b>
        <small>$0 for Electricity</small>
      </button>
      <button
        type="button"
        id="bn"
        aria-pressed={targetMode === 1}
        onClick={() => selectTimeOfDay(1)}
      >
        <b>Night</b>
        <small>$0 for Electricity</small>
      </button>
    </div>
  );
}

export function CompactTimeSwitch() {
  const { targetMode, selectTimeOfDay } = useAtmosphere();

  return (
    <div
      className="compact-time-switch"
      role="group"
      aria-label="Toggle Morning or Night theme"
      data-testid="header-theme-toggle"
    >
      <button
        type="button"
        className={`compact-time-btn ${targetMode === 0 ? 'is-selected' : ''}`}
        aria-pressed={targetMode === 0}
        onClick={() => selectTimeOfDay(0)}
        title="Morning theme"
      >
        <SunIcon size={14} />
        <span>Morning</span>
      </button>
      <button
        type="button"
        className={`compact-time-btn ${targetMode === 1 ? 'is-selected' : ''}`}
        aria-pressed={targetMode === 1}
        onClick={() => selectTimeOfDay(1)}
        title="Night theme"
      >
        <MoonIcon size={14} />
        <span>Night</span>
      </button>
    </div>
  );
}

export default TimeToggle;
