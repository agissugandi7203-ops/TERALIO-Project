import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const RouterContext = createContext(null);

const PAGE_TITLES = {
  '/': 'Teralio',
  '/how-it-works': 'How It Works — Teralio',
  '/our-cases': 'Our Cases & Testimonials — Teralio',
  '/about-us': 'About Us — Teralio',
  '/careers': 'Careers — Teralio',
  '/resources': 'Resources & FAQ — Teralio',
  '/customers': 'Customer Portal — Teralio',
  '/quote': 'Instant Quote & Pricing — Teralio',
  '/signup': 'Join Teralio — Create Profile',
  '/login': 'Sign In — Teralio',
};

function normalizePath(rawPath) {
  if (!rawPath) return '/';
  const clean = rawPath.split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) {
    return clean.slice(0, -1);
  }
  return clean || '/';
}

export function RouterProvider({ children, initialPath }) {
  const [locationState, setLocationState] = useState(() => {
    if (initialPath) {
      const [pathname, search = ''] = initialPath.split('?');
      return {
        pathname: normalizePath(pathname),
        search: search ? `?${search}` : '',
      };
    }
    if (typeof window !== 'undefined') {
      return {
        pathname: normalizePath(window.location.pathname),
        search: window.location.search || '',
      };
    }
    return { pathname: '/', search: '' };
  });

  useEffect(() => {
    const onPopState = () => {
      setLocationState({
        pathname: normalizePath(window.location.pathname),
        search: window.location.search || '',
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const title = PAGE_TITLES[locationState.pathname] || 'Teralio';
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  }, [locationState.pathname]);

  const navigate = useCallback(
    (to, options = {}) => {
      if (!to) return;
      const [rawPathname, rawSearch = ''] = to.split('?');
      const nextPathname = normalizePath(rawPathname);
      const nextSearch = rawSearch ? `?${rawSearch}` : '';
      const fullUrl = `${nextPathname}${nextSearch}`;

      if (typeof window !== 'undefined' && !initialPath) {
        if (options.replace) {
          window.history.replaceState({}, '', fullUrl);
        } else {
          window.history.pushState({}, '', fullUrl);
        }
        if (!options.preserveScroll) {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
      }

      setLocationState({
        pathname: nextPathname,
        search: nextSearch,
      });
    },
    [initialPath]
  );

  const searchParams = useMemo(() => {
    return new URLSearchParams(locationState.search);
  }, [locationState.search]);

  const value = useMemo(
    () => ({
      pathname: locationState.pathname,
      search: locationState.search,
      searchParams,
      navigate,
    }),
    [locationState.pathname, locationState.search, searchParams, navigate]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    return {
      pathname: '/',
      search: '',
      searchParams: new URLSearchParams(),
      navigate: () => {},
    };
  }
  return ctx;
}

export function Link({ to, onClick, children, className, activeClassName, ...rest }) {
  const { pathname, navigate } = useRouter();
  const targetPath = normalizePath(to);
  const isActive = pathname === targetPath;

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey ||
      rest.target === '_blank'
    ) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };

  const combinedClassName = [className, isActive && activeClassName ? activeClassName : '']
    .filter(Boolean)
    .join(' ');

  return (
    <a
      href={to}
      onClick={handleClick}
      className={combinedClassName || undefined}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      {children}
    </a>
  );
}
