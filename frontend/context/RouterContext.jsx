import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PAGE_METADATA, ROUTES } from '../constants/navigation.js';

const RouterContext = createContext(null);

const normalizePath = (rawPath) => {
  if (!rawPath || rawPath === '/') return ROUTES.HOME;
  const withoutQuery = rawPath.split('?')[0].split('#')[0];
  const trimmed = withoutQuery.replace(/\/+$/, '');
  return trimmed || ROUTES.HOME;
};

export function RouterProvider({ initialPath, children }) {
  const [currentPath, setCurrentPath] = useState(() =>
    normalizePath(initialPath ?? (typeof window !== 'undefined' ? window.location.pathname : ROUTES.HOME))
  );

  const navigate = useCallback((nextPath, { replace = false } = {}) => {
    const normalized = normalizePath(nextPath);
    if (typeof window !== 'undefined') {
      const historyMethod = replace ? 'replaceState' : 'pushState';
      if (normalizePath(window.location.pathname) !== normalized) {
        window.history[historyMethod]({}, '', normalized);
      }
      if (typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } catch {
          // Ignore unimplemented window.scrollTo in headless test environments
        }
      }
    }
    setCurrentPath(normalized);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const meta = PAGE_METADATA[currentPath] ?? PAGE_METADATA[ROUTES.HOME];
    document.title = meta.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', meta.description);
    }
  }, [currentPath]);

  const value = useMemo(
    () => ({
      currentPath,
      navigate,
      isActive: (path) => normalizePath(path) === currentPath,
    }),
    [currentPath, navigate]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used inside a RouterProvider');
  }
  return ctx;
}

export function AppLink({ to, className = '', activeClassName = 'is-active', onClick, children, ...rest }) {
  const { navigate, isActive } = useRouter();
  const active = isActive(to);

  const handleClick = (event) => {
    if (onClick) onClick(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(to);
  };

  const combinedClassName = [className, active ? activeClassName : ''].filter(Boolean).join(' ');

  return (
    <a
      href={to}
      className={combinedClassName || undefined}
      aria-current={active ? 'page' : undefined}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
