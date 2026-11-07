import React, { forwardRef } from 'react';
import { Orb } from '@yogesharc/thinking-orbs';

/**
 * Daftar state & variant resmi dari `@yogesharc/thinking-orbs@0.1.2`.
 * Menjamin tidak pernah ada string state di luar kontrak library yang dikirim ke `<Orb />`.
 */
export const VALID_ORB_VARIANTS = {
  idle: ['default', 'blink'],
  working: ['default', 'gyro'],
  reasoning: ['default', 'twins'],
  searching: ['default', 'lighthouse'],
  background: ['default', 'spiral'],
  retrying: ['default', 'surge'],
  compacting: ['default', 'squeeze', 'fuse'],
  waiting: ['default'],
  using: ['default', 'tap', 'scroll', 'type', 'zoom', 'snap', 'record'],
};

/**
 * Pemetaan resmi aktivitas sistem AI TERALIO -> OrbState & Variant.
 */
export const ORB_ACTIVITY_PRESETS = {
  ready: { state: 'idle', variant: 'default' },
  listening: { state: 'idle', variant: 'blink' },
  reasoning: { state: 'reasoning', variant: 'default' },
  deepReasoning: { state: 'reasoning', variant: 'twins' },
  webSearch: { state: 'searching', variant: 'lighthouse' },
  mcpOrTool: { state: 'working', variant: 'gyro' },
  speaking: { state: 'working', variant: 'default' },
  browserOrComputer: { state: 'using', variant: 'scroll' },
  retrying: { state: 'retrying', variant: 'surge' },
  waiting: { state: 'waiting', variant: 'default' },
  compacting: { state: 'compacting', variant: 'squeeze' },
  background: { state: 'background', variant: 'spiral' },
};

export function resolveSafeOrbProps(rawState = 'idle', rawVariant = 'default') {
  const safeState = Object.prototype.hasOwnProperty.call(VALID_ORB_VARIANTS, rawState)
    ? rawState
    : 'idle';
  const allowedVariants = VALID_ORB_VARIANTS[safeState];
  const safeVariant = allowedVariants.includes(rawVariant) ? rawVariant : 'default';
  return { state: safeState, variant: safeVariant };
}

export const ThinkingOrbStage = forwardRef(function ThinkingOrbStage(
  {
    mode = 'inline',
    state = 'idle',
    variant = 'default',
    phase = 'idle',
    speed = 1,
    paused = false,
    size,
    label,
    showLabel = true,
    className = '',
  },
  stageRef,
) {
  const resolved = resolveSafeOrbProps(state, variant);
  const resolvedSize = typeof size === 'number' ? size : mode === 'hero' ? 184 : 20;

  if (mode === 'hero') {
    return (
      <div
        ref={stageRef}
        className={`thinking-orb-hero phase-${phase} state-${resolved.state} ${className}`.trim()}
        data-testid="thinking-orb-hero"
        data-orb-state={resolved.state}
        data-orb-variant={resolved.variant}
        data-voice-phase={phase}
      >
        <div className="thinking-orb-hero__ambient" aria-hidden="true" />
        <div className="thinking-orb-hero__halo" aria-hidden="true" />
        <div className="thinking-orb-hero__core">
          <Orb
            state={resolved.state}
            variant={resolved.variant}
            size={resolvedSize}
            speed={speed}
            paused={false}
            label={label || `AI ${resolved.state}`}
            className="thinking-orb-hero__svg"
          />
        </div>
      </div>
    );
  }

  return (
    <span
      ref={stageRef}
      className={`thinking-orb-inline state-${resolved.state} ${className}`.trim()}
      data-testid="thinking-orb-inline"
      data-orb-state={resolved.state}
      data-orb-variant={resolved.variant}
    >
      <span className="thinking-orb-inline__glyph">
        <Orb
          state={resolved.state}
          variant={resolved.variant}
          size={resolvedSize}
          speed={speed}
          paused={paused}
          label={label || `AI ${resolved.state}`}
        />
      </span>
      {showLabel && label && <span className="thinking-orb-inline__label">{label}</span>}
    </span>
  );
});

export default ThinkingOrbStage;
