import React from 'react';
import { RouterProvider, useRouter, Link } from './context/RouterContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import OurCasesPage from './pages/OurCasesPage.jsx';
import AboutUsPage from './pages/AboutUsPage.jsx';
import CareersPage from './pages/CareersPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import QuotePage from './pages/QuotePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import './styles/hero.css';
import './styles/pages.css';
import './styles/footer.css';
import './styles/auth.css';

function RouteView() {
  const { pathname } = useRouter();

  switch (pathname) {
    case '/':
      return <HomePage />;
    case '/how-it-works':
      return <HowItWorksPage />;
    case '/our-cases':
      return <OurCasesPage />;
    case '/about-us':
      return <AboutUsPage />;
    case '/careers':
      return <CareersPage />;
    case '/resources':
      return <ResourcesPage />;
    case '/customers':
      return <CustomersPage />;
    case '/quote':
      return <QuotePage />;
    case '/signup':
      return <AuthPage mode="signup" />;
    case '/login':
      return <AuthPage mode="login" />;
    default:
      return (
        <main className="section">
          <div className="container glass-card glass-card--centered">
            <span className="eyebrow eyebrow--flush">404 &bull; Route Not Found</span>
            <h1 className="section-title">We couldn’t find that Teralio page.</h1>
            <p className="card-body">
              Return to the main experience or jump directly to your instant roof configurator.
            </p>
            <div className="flex-row-wrap">
              <Link to="/" className="btn-pill">
                Return Home
              </Link>
              <Link to="/quote" className="btn-pill btn-pill--ghost">
                Get an Instant Quote
              </Link>
            </div>
          </div>
        </main>
      );
  }
}

function AppShell() {
  const { pathname } = useRouter();
  const isHome = pathname === '/';
  const isStandaloneAuth = pathname === '/signup' || pathname === '/login';

  if (isStandaloneAuth) {
    return <RouteView />;
  }

  return (
    <div className="site-shell">
      {!isHome && <Header />}
      <RouteView />
      <Footer />
    </div>
  );
}

export function App({ initialPath }) {
  return (
    <ThemeProvider>
      <RouterProvider initialPath={initialPath}>
        <AppShell />
      </RouterProvider>
    </ThemeProvider>
  );
}

export default App;
