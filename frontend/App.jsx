import React, { useState, useEffect, useCallback } from 'react';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import PageHero from './components/PageHero.jsx';
import { ROUTES } from './constants/navigation.js';
import { AtmosphereProvider } from './context/AtmosphereContext.jsx';
import { AppLink, RouterProvider, useRouter } from './context/RouterContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import authApi from './services/authApi.js';
import './styles/hero.css';
import './styles/layout.css';
import './styles/pages.css';

const ROUTE_SECTION_MAP = Object.freeze({
  [ROUTES.HOW_IT_WORKS]: 'how-it-works',
  [ROUTES.CASES]: 'cases',
  [ROUTES.CAREERS]: 'careers',
  [ROUTES.CUSTOMERS]: 'customers',
  [ROUTES.RESOURCES]: 'faq',
  [ROUTES.QUOTE]: 'get-started',
});

function NotFoundView() {
  return (
    <PageHero
      eyebrow="404 • Route Not Found"
      titlePrimary="Page Outside Coverage"
      titleMuted="return to"
      titleAccent="Teralio Home"
      description="The page you requested could not be found. Return to the main overview or sign in to your Teralio space."
      actions={
        <AppLink to={ROUTES.HOME} className="cta">
          Back to Teralio Home
        </AppLink>
      }
    />
  );
}

function AuthCallbackView({ onVerified }) {
  const { navigate } = useRouter();

  useEffect(() => {
    let active = true;
    authApi
      .handleOAuthCallback()
      .then((res) => {
        if (!active) return;
        if (res?.user && onVerified) {
          onVerified(res.user);
        } else {
          const stored = authApi.getStoredUser();
          if (stored?.email && onVerified) {
            onVerified(stored);
          } else {
            navigate(ROUTES.LOGIN, { replace: true });
          }
        }
      })
      .catch((err) => {
        console.warn('[AuthCallbackView] Callback resolution error:', err);
        const stored = authApi.getStoredUser();
        if (stored?.email && onVerified) {
          onVerified(stored);
        } else {
          navigate(ROUTES.LOGIN, { replace: true });
        }
      });

    return () => {
      active = false;
    };
  }, [onVerified, navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-6 py-12 text-center">
      <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
      <h2 className="text-xl font-semibold tracking-tight">Verifying Session with Supabase</h2>
      <p className="text-sm text-white/50 mt-1 max-w-sm">
        Please wait a moment while we synchronize your OAuth credentials with your Teralio space.
      </p>
    </div>
  );
}

function AppShell() {
  const { currentPath, navigate } = useRouter();
  const [currentUser, setCurrentUser] = useState(() => authApi.getStoredUser());

  // Redirect to Dashboard on successful login or registration
  const handleAuthSuccess = useCallback(
    (user) => {
      setCurrentUser(user);
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    [navigate]
  );

  const handleLogout = useCallback(async () => {
    await authApi.logout();
    setCurrentUser(null);
    navigate(ROUTES.HOME, { replace: true });
  }, [navigate]);

  // Listen to external Supabase auth changes (OAuth redirects, token refresh, etc.)
  useEffect(() => {
    const unsubscribe = authApi.listenAuthState((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });

    // Check for hash token or OAuth redirect code
    if (typeof window !== 'undefined') {
      const hasAuthHash = window.location.hash.includes('access_token=');
      const hasAuthCode = window.location.search.includes('code=');

      if (hasAuthHash || hasAuthCode || currentPath === ROUTES.AUTH_CALLBACK) {
        authApi.handleOAuthCallback().then((res) => {
          if (res?.user) {
            setCurrentUser(res.user);
            navigate(ROUTES.DASHBOARD, { replace: true });
          }
          if (window.location.hash) {
            try {
              window.history.replaceState(null, '', window.location.pathname);
            } catch {}
          }
        });
      }
    }

    return () => unsubscribe();
  }, [currentPath, navigate]);

  useEffect(() => {
    const targetSection = ROUTE_SECTION_MAP[currentPath];
    if (targetSection && typeof window !== 'undefined') {
      const el = document.getElementById(targetSection);
      if (el) {
        setTimeout(() => {
          const headerClearance = 115;
          const targetY = el.getBoundingClientRect().top + window.pageYOffset - headerClearance;
          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: 'smooth',
          });
          if (typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 60);
      }
    }
  }, [currentPath]);

  // Sinkronkan URL browser ke /dashboard saat pengguna sudah login
  useEffect(() => {
    if (
      currentUser &&
      (currentPath === ROUTES.LOGIN ||
        currentPath === ROUTES.SIGNUP ||
        currentPath === '/register')
    ) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [currentUser, currentPath, navigate]);

  if (currentPath === ROUTES.AUTH_CALLBACK) {
    return <AuthCallbackView onVerified={handleAuthSuccess} />;
  }

  // PRIORITAS UTAMA: Jika user sudah terotentikasi, tampilkan DashboardPage langsung
  if (currentUser) {
    if (
      currentPath === ROUTES.DASHBOARD ||
      currentPath === ROUTES.HOME ||
      currentPath === ROUTES.LOGIN ||
      currentPath === ROUTES.SIGNUP ||
      currentPath === '/register' ||
      currentPath === ROUTES.SCHEDULE ||
      currentPath === ROUTES.VISIT_SCHEDULE ||
      currentPath === '/schedule' ||
      currentPath === '/visit-schedule'
    ) {
      return (
        <DashboardPage
          user={currentUser}
          onLogout={handleLogout}
          onNavigate={navigate}
          initialNav={
            currentPath === ROUTES.SCHEDULE ||
            currentPath === ROUTES.VISIT_SCHEDULE ||
            currentPath === '/schedule' ||
            currentPath === '/visit-schedule'
              ? 'schedule'
              : undefined
          }
        />
      );
    }
  }

  // Jika user belum login, tampilkan halaman autentikasi
  if (currentPath === ROUTES.LOGIN || currentPath === ROUTES.SIGNUP || currentPath === '/register') {
    return (
      <AuthPage
        initialMode={currentPath === ROUTES.LOGIN ? 'login' : 'signup'}
        onNavigate={navigate}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // Jika user mengakses /dashboard atau /schedule secara langsung (termasuk mode tamu/guest), render DashboardPage
  if (
    currentPath === ROUTES.DASHBOARD ||
    currentPath === ROUTES.SCHEDULE ||
    currentPath === ROUTES.VISIT_SCHEDULE ||
    currentPath === '/schedule' ||
    currentPath === '/visit-schedule'
  ) {
    return (
      <DashboardPage
        user={currentUser}
        onLogout={handleLogout}
        onNavigate={navigate}
        initialNav={
          currentPath === ROUTES.SCHEDULE ||
          currentPath === ROUTES.VISIT_SCHEDULE ||
          currentPath === '/schedule' ||
          currentPath === '/visit-schedule'
            ? 'schedule'
            : undefined
        }
      />
    );
  }

  const isKnownLandingRoute = currentPath === ROUTES.HOME || Boolean(ROUTE_SECTION_MAP[currentPath]);
  const ActivePage = isKnownLandingRoute ? HomePage : NotFoundView;

  return (
    <div className="app-shell">
      <Header user={currentUser} onLogout={handleLogout} />
      <main className="app-main">
        <ActivePage />
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export function App({ initialPath }) {
  return (
    <AtmosphereProvider>
      <RouterProvider initialPath={initialPath}>
        <AppShell />
      </RouterProvider>
    </AtmosphereProvider>
  );
}

export default App;
