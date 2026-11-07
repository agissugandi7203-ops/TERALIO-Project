import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { HERO_TIMING } from '../constants/heroAssets.js';

export const AtmosphereContext = createContext(null);

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function AtmosphereProvider({ children }) {
  // Starts on Night (--k: 1, night set visible, Night button pressed)
  const [targetMode, setTargetMode] = useState(1); // 0 = Morning, 1 = Night
  const [visibleSet, setVisibleSet] = useState(1); // Swaps strictly at d >= SINK_MS

  const animRef = useRef({
    night: 1,
    target: 1,
    from: 1,
    start: -1e9,
    queued: null,
    swapped: true,
    animating: false,
    k: 1,
    clock: 0,
  });

  const houseRefs = useRef({ setM: null, setN: null });
  const fogRendererRef = useRef(null);

  const applyDomHouseVisibility = useCallback((nightFlag) => {
    const isNight = Boolean(nightFlag);
    if (houseRefs.current.setM) {
      houseRefs.current.setM.classList.toggle('is-on', !isNight);
    }
    if (houseRefs.current.setN) {
      houseRefs.current.setN.classList.toggle('is-on', isNight);
    }
    setVisibleSet(isNight ? 1 : 0);
  }, []);

  const writeCssVariables = useCallback((yRatio, kVal, k2Val, dipVal) => {
    if (typeof document === 'undefined') return;
    const rootStyle = document.documentElement.style;
    const vh = typeof window !== 'undefined' ? window.innerHeight || 900 : 900;
    rootStyle.setProperty('--sink', `${(yRatio * vh).toFixed(1)}px`);
    rootStyle.setProperty('--k', kVal.toFixed(3));
    rootStyle.setProperty('--k2', k2Val.toFixed(3));
    rootStyle.setProperty('--dip', dipVal.toFixed(3));
  }, []);

  const beginTransition = useCallback((nextTarget, now) => {
    const state = animRef.current;
    state.target = nextTarget;
    state.from = state.k;
    state.start = now;
    state.swapped = false;
    state.animating = true;
  }, []);

  const selectTimeOfDay = useCallback(
    (nextMode) => {
      const normalized = nextMode ? 1 : 0;
      const state = animRef.current;

      if (normalized === state.target && state.queued === null) {
        return;
      }

      setTargetMode(normalized);

      if (prefersReducedMotion()) {
        state.target = normalized;
        state.night = normalized;
        state.k = normalized;
        state.queued = null;
        state.animating = false;
        state.swapped = true;
        applyDomHouseVisibility(normalized);
        writeCssVariables(0, normalized, normalized, 0);
        return;
      }

      if (state.animating) {
        state.queued = normalized;
      } else {
        const now = state.clock || (typeof performance !== 'undefined' ? performance.now() : 0);
        beginTransition(normalized, now);
      }
    },
    [applyDomHouseVisibility, beginTransition, writeCssVariables]
  );

  const toggleTimeOfDay = useCallback(() => {
    const next = animRef.current.target === 1 ? 0 : 1;
    selectTimeOfDay(next);
  }, [selectTimeOfDay]);

  const registerHouseElements = useCallback((morningEl, nightEl) => {
    houseRefs.current.setM = morningEl;
    houseRefs.current.setN = nightEl;
    const isNight = Boolean(animRef.current.night);
    if (morningEl) morningEl.classList.toggle('is-on', !isNight);
    if (nightEl) nightEl.classList.toggle('is-on', isNight);
  }, []);

  const registerFogRenderer = useCallback((rendererFn) => {
    fogRendererRef.current = rendererFn;
  }, []);

  useEffect(() => {
    writeCssVariables(0, 1, 1, 0);

    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      return undefined;
    }

    const { SINK_MS: SINK, RISE_MS: RISE, DEPTH_RATIO: DEPTH } = HERO_TIMING;
    let rafId = 0;

    const frame = (now) => {
      const state = animRef.current;
      state.clock = now;

      const d = now - state.start;
      let y = 0;
      let s = 0;
      let dip = 0;
      let k2 = state.k;

      if (state.animating) {
        if (d < SINK) {
          const x = d / SINK;
          y = x * x * (3 - 2 * x) * DEPTH;
        } else {
          if (!state.swapped) {
            state.swapped = true;
            state.night = state.target;
            applyDomHouseVisibility(state.target);
          }
          const x = clamp((d - SINK) / RISE);
          y = Math.pow(1 - x, 3.4) * DEPTH;
        }

        s = smooth(0, SINK * 0.92, d) * (1 - smooth(SINK + 70, SINK + RISE * 0.92, d));
        dip = smooth(30, 190, d) * (1 - smooth(330, 720, d));
        state.k = state.from + (state.target - state.from) * smooth(120, 520, d);
        k2 = state.from + (state.target - state.from) * smooth(340, 760, d);

        if (d >= SINK + RISE) {
          state.animating = false;
          state.k = state.target;
          k2 = state.target;
          y = 0;
          s = 0;
          dip = 0;
          writeCssVariables(0, state.target, state.target, 0);

          if (state.queued !== null && state.queued !== state.target) {
            const nextQueued = state.queued;
            state.queued = null;
            setTargetMode(nextQueued);
            beginTransition(nextQueued, now);
          } else {
            state.queued = null;
          }
        }
      }

      if (state.animating) {
        writeCssVariables(y, state.k, k2, dip);
      }

      if (fogRendererRef.current) {
        fogRendererRef.current(now, s, state.k);
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [applyDomHouseVisibility, beginTransition, writeCssVariables]);

  const value = useMemo(
    () => ({
      targetMode,
      isNight: targetMode === 1,
      visibleSet,
      selectTimeOfDay,
      toggleTimeOfDay,
      registerHouseElements,
      registerFogRenderer,
    }),
    [
      targetMode,
      visibleSet,
      selectTimeOfDay,
      toggleTimeOfDay,
      registerHouseElements,
      registerFogRenderer,
    ]
  );

  return <AtmosphereContext.Provider value={value}>{children}</AtmosphereContext.Provider>;
}

export function useAtmosphere() {
  const ctx = useContext(AtmosphereContext);
  if (!ctx) {
    return {
      targetMode: 1,
      isNight: true,
      visibleSet: 1,
      selectTimeOfDay: () => {},
      toggleTimeOfDay: () => {},
      registerHouseElements: () => {},
      registerFogRenderer: () => {},
    };
  }
  return ctx;
}
