export const ROUTES = Object.freeze({
  HOME: '/',
  DASHBOARD: '/dashboard',
  HOW_IT_WORKS: '/how-it-works',
  CASES: '/cases',
  ABOUT: '/about',
  CAREERS: '/careers',
  RESOURCES: '/resources',
  CUSTOMERS: '/customers',
  QUOTE: '/quote',
  LOGIN: '/login',
  SIGNUP: '/signup',
  AUTH_CALLBACK: '/auth/callback',
});

export const PRIMARY_NAV_LINKS = Object.freeze([
  { label: 'How It Works', path: ROUTES.HOW_IT_WORKS },
  { label: 'Our Cases', path: ROUTES.CASES },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Customers', path: ROUTES.CUSTOMERS },
  { label: 'FAQ', path: ROUTES.RESOURCES },
]);

export const PAGE_METADATA = Object.freeze({
  [ROUTES.HOME]: {
    title: 'Teralio — Smarter Living Discovery Powered by AI',
    description:
      'Forget the energy market, weather conditions and seasons. Teralio orchestrates intelligent living spaces and zero-bill autonomy.',
  },
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard — Teralio AI Living Hub',
    description:
      'Personalized student accommodation discovery, preference tracking, and AI living orchestration.',
  },
  [ROUTES.HOW_IT_WORKS]: {
    title: 'How It Works — Teralio Smart Architecture',
    description:
      'Explore how Teralio pairs architectural solar roofs, high-density storage, and AI orchestration.',
  },
  [ROUTES.CASES]: {
    title: 'Our Cases — Teralio Architectural Installations',
    description:
      'Real homes across Nordic, coastal, alpine, and urban climates powered by Teralio.',
  },
  [ROUTES.ABOUT]: {
    title: 'About Us — Teralio',
    description:
      'Meet the engineers, architects, and AI researchers behind Teralio.',
  },
  [ROUTES.CAREERS]: {
    title: 'Careers — Build the Future of Living at Teralio',
    description:
      'Join Teralio across AI engineering, neural orchestration, architectural design, and operations.',
  },
  [ROUTES.RESOURCES]: {
    title: 'Resources — Whitepapers & Guides | Teralio',
    description:
      'Technical specifications, resilience reports, and full platform documentation.',
  },
  [ROUTES.CUSTOMERS]: {
    title: 'Customers & Member Portal — Teralio',
    description:
      'Verified telemetry, member stories, and live Teralio portal access.',
  },
  [ROUTES.QUOTE]: {
    title: 'Get an Instant Quote — Teralio Configurator',
    description:
      'Calculate your custom Teralio configuration and projected savings in under 60 seconds.',
  },
  [ROUTES.LOGIN]: {
    title: 'Log In — Teralio',
    description: 'Sign in to your Teralio workspace.',
  },
  [ROUTES.SIGNUP]: {
    title: 'Join Teralio — Create New Profile',
    description: 'Activate your Teralio space in three quick phases.',
  },
});
