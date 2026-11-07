import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

export const SINK = 240;
export const RISE = 820;
export const DEPTH = 0.27;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ThemeProvider({ children }) {
  // 1 = Dark / Night (initial default), 0 = Light / Morning
  const [targetNight, setTargetNight] = useState(1);
  const [visibleSet, setVisibleSet] = useState(1);

  const engineRef = useRef({
    night: 1,
    target: 1,
    from: 1,
    start: -1e9,
    queued: null,
    swapped: true,
    animating: false,
    clock: 0,
    k: 1,
    k2: 1,
    dip: 0,
    y: 0,
    s: 0,
    glSubscriber: null,
  });

  const applyRootTheme = useCallback((yPx, kVal, k2Val, dipVal) => {
    if (typeof document === 'undefined') return;
    const docEl = document.documentElement;
    const root = docEl.style;
    root.setProperty('--sink', `${yPx.toFixed(1)}px`);
    root.setProperty('--k', kVal.toFixed(3));
    root.setProperty('--k2', k2Val.toFixed(3));
    root.setProperty('--dip', dipVal.toFixed(3));
    docEl.dataset.theme = kVal >= 0.5 ? 'dark' : 'light';
  }, []);

  const beginTransition = useCallback((n, now) => {
    const st = engineRef.current;
    st.target = n;
    st.from = st.k;
    st.start = now;
    st.swapped = false;
    st.animating = true;
    setTargetNight(n);
  }, []);

  const pickTimeOfDay = useCallback(
    (n) => {
      const next = n ? 1 : 0;
      const st = engineRef.current;
      if (next === st.target && st.queued === null) return;

      setTargetNight(next);

      if (prefersReducedMotion()) {
        st.target = next;
        st.night = next;
        st.k = next;
        st.k2 = next;
        st.dip = 0;
        st.y = 0;
        st.s = 0;
        st.animating = false;
        st.queued = null;
        setVisibleSet(next);
        applyRootTheme(0, next, next, 0);
        return;
      }

      if (st.animating) {
        st.queued = next;
      } else {
        const now = st.clock || (typeof performance !== 'undefined' ? performance.now() : 0);
        beginTransition(next, now);
      }
    },
    [applyRootTheme, beginTransition]
  );

  const toggleTimeOfDay = useCallback(() => {
    const st = engineRef.current;
    const activeTarget = st.queued !== null ? st.queued : st.target;
    pickTimeOfDay(activeTarget === 1 ? 0 : 1);
  }, [pickTimeOfDay]);

  const registerGlSubscriber = useCallback((fn) => {
    engineRef.current.glSubscriber = fn;
    return () => {
      if (engineRef.current.glSubscriber === fn) {
        engineRef.current.glSubscriber = null;
      }
    };
  }, []);

  useEffect(() => {
    applyRootTheme(0, 1, 1, 0);

    let rafId = 0;
    const frame = (now) => {
      const st = engineRef.current;
      st.clock = now;
      const d = now - st.start;
      let y = 0;
      let s = 0;
      let dip = 0;
      let k2 = st.k;

      if (st.animating) {
        if (d < SINK) {
          const x = d / SINK;
          y = x * x * (3 - 2 * x) * DEPTH;
        } else {
          if (!st.swapped) {
            st.swapped = true;
            st.night = st.target;
            setVisibleSet(st.target);
          }
          const x = clamp((d - SINK) / RISE);
          y = Math.pow(1 - x, 3.4) * DEPTH;
        }
        s = smooth(0, SINK * 0.92, d) * (1 - smooth(SINK + 70, SINK + RISE * 0.92, d));
        dip = smooth(30, 190, d) * (1 - smooth(330, 720, d));
        st.k = st.from + (st.target - st.from) * smooth(120, 520, d);
        k2 = st.from + (st.target - st.from) * smooth(340, 760, d);

        if (d >= SINK + RISE) {
          st.animating = false;
          st.k = st.target;
          k2 = st.target;
          y = 0;
          s = 0;
          dip = 0;
          if (st.queued !== null && st.queued !== st.target) {
            const q = st.queued;
            st.queued = null;
            beginTransition(q, now);
          } else {
            st.queued = null;
          }
        }
      }

      st.k2 = k2;
      st.dip = dip;
      st.y = y;
      st.s = s;

      const vh = typeof window !== 'undefined' ? window.innerHeight || 900 : 900;
      applyRootTheme(y * vh, st.k, k2, dip);

      if (st.glSubscriber) {
        st.glSubscriber(now, s, st.k);
      }

      rafId = window.requestAnimationFrame(frame);
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      rafId = window.requestAnimationFrame(frame);
    }

    return () => {
      if (rafId && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [applyRootTheme, beginTransition]);

  const isNight = Boolean(targetNight);

  return (
    <ThemeContext.Provider
      value={{
        theme: isNight ? 'dark' : 'light',
        isNight,
        targetNight,
        visibleSet,
        pickTimeOfDay,
        toggleTimeOfDay,
        registerGlSubscriber,
        engineRef,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'dark',
      isNight: true,
      targetNight: 1,
      visibleSet: 1,
      pickTimeOfDay: () => {},
      toggleTimeOfDay: () => {},
      registerGlSubscriber: () => () => {},
      engineRef: { current: { k: 1, s: 0 } },
    };
  }
  return ctx;
}
