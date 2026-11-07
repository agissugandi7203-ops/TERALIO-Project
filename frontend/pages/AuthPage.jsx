import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Circle, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import StepItem from '../components/auth/StepItem.jsx';
import SocialButton from '../components/auth/SocialButton.jsx';
import InputGroup from '../components/auth/InputGroup.jsx';
import { useAtmosphere } from '../context/AtmosphereContext.jsx';
import { SunIcon, MoonIcon } from '../components/Icons.jsx';
import authApi from '../services/authApi.js';
import '../styles/auth-tailwind.css';

const AUTH_HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4';

const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const formContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const formItemVariants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

function ChromeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function AuthPage({
  initialMode = 'signup',
  onNavigate,
  onAuthSuccess,
}) {
  const { isNight, toggleTimeOfDay } = useAtmosphere();
  const [mode, setMode] = useState(initialMode === 'login' ? 'login' : 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [activePhase, setActivePhase] = useState(1);
  const [statusMessage, setStatusMessage] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    setMode(initialMode === 'login' ? 'login' : 'signup');
    setStatusMessage(null);
  }, [initialMode]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('auth-dark-mode', isNight);
      document.body.classList.toggle('auth-light-mode', !isNight);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('auth-dark-mode');
        document.body.classList.remove('auth-light-mode');
      }
    };
  }, [isNight]);

  const isLogin = mode === 'login';

  const handleInputChange = (field) => (e) => {
    const val = e.target.value;
    setStatusMessage(null);
    setFormData((prev) => {
      const next = { ...prev, [field]: val };
      const hasDetails = Boolean(next.email.trim() || next.firstName.trim());
      setActivePhase(hasDetails ? 2 : 1);
      return next;
    });
  };

  const switchMode = (targetMode) => {
    setMode(targetMode);
    setStatusMessage(null);
    setActivePhase(1);
    if (onNavigate) {
      onNavigate(targetMode === 'login' ? '/login' : '/signup', { replace: true });
    }
  };

  /**
   * Supabase OAuth Handler (Google & GitHub)
   * Ditangani secara internal & native dengan spinning loader halus
   */
  const handleSocialAuth = async (provider) => {
    setStatusMessage(null);
    setSocialLoading(provider);

    try {
      const result = await authApi.signInWithOAuth(provider);
      const oauthUrl = result?.url || result?.data?.url;

      if (oauthUrl) {
        setActivePhase(3);
        if (typeof window !== 'undefined' && !window.__VITEST__) {
          window.location.assign(oauthUrl);
          return;
        }
        setSocialLoading(null);
        return;
      }

      setActivePhase(3);
      setSocialLoading(null);
    } catch (err) {
      setSocialLoading(null);
      setStatusMessage({
        type: 'error',
        text: err.message || `Gagal memproses autentikasi ${provider}. Silakan coba lagi.`,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!formData.email.trim()) {
      setStatusMessage({ type: 'error', text: 'Email wajib diisi.' });
      return;
    }

    if (!isLogin && formData.password.length < 8) {
      setStatusMessage({
        type: 'error',
        text: 'Requires at least 8 symbols.',
      });
      return;
    }

    if (isLogin && !formData.password) {
      setStatusMessage({ type: 'error', text: 'Password wajib diisi.' });
      return;
    }

    setLoading(true);
    try {
      const result = isLogin
        ? await authApi.login({
            email: formData.email,
            password: formData.password,
          })
        : await authApi.register({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
          });

      setActivePhase(3);
      const user =
        result?.data?.user ||
        authApi.getStoredUser() || {
          fullName: formData.firstName
            ? `${formData.firstName} ${formData.lastName}`.trim()
            : formData.email.split('@')[0] || 'Andreas',
          email: formData.email,
        };

      setStatusMessage({
        type: 'success',
        text:
          result?.message ||
          (isLogin ? 'Login berhasil! Mengarahkan ke Dashboard...' : 'Akun berhasil dibuat! Mengarahkan ke Dashboard...'),
      });

      // Segera sinkronkan sesi dan langsung arahkan otomatis ke /dashboard
      if (onAuthSuccess) {
        onAuthSuccess(user);
      }
      if (onNavigate) {
        onNavigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan saat memproses autentikasi.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, scale: 0.995 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      data-testid="auth-page"
      className={`flex flex-col lg:flex-row items-center justify-center min-h-[100dvh] min-h-screen w-full ${
        isNight
          ? 'auth-theme-dark bg-black text-white selection:bg-white/30'
          : 'auth-theme-light bg-[#f2f4ef] text-[#14202f] selection:bg-[#14202f]/20'
      } p-3 sm:p-4 lg:p-4 transition-colors duration-500 lg:h-screen lg:overflow-hidden font-sans antialiased`}
    >
      {/* 3. Left Column (Hero & Background Video) - mentok sampai ujung layar */}
      <motion.section
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        data-testid="auth-hero-column"
        className="hidden lg:flex w-[52%] relative flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          data-testid="auth-hero-video"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={AUTH_HERO_VIDEO_URL} type="video/mp4" />
        </video>

        {/* Hero Content Container: purely over video without any dark overlay, gradient, or tint mask */}
        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
          className="z-10 w-full max-w-xs space-y-8"
        >
          {/* Brand/Logo */}
          <motion.div variants={heroItemVariants} className="flex items-center gap-2.5">
            <Circle className="w-5 h-5 fill-white text-white" />
            <span className="text-xl font-semibold tracking-tight text-white">Teralio</span>
          </motion.div>

          {/* Heading Block */}
          <motion.div variants={heroItemVariants} className="space-y-2">
            <h1 className="text-4xl font-medium tracking-tight whitespace-nowrap text-white">
              Join Teralio
            </h1>
            <p className="text-white/60 text-sm leading-relaxed px-4">
              Follow these 3 quick phases to activate your space.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div variants={heroItemVariants} className="space-y-3">
            <StepItem
              number={1}
              text="Register your identity"
              active={activePhase === 1}
            />
            <StepItem
              number={2}
              text="Configure your studio"
              active={activePhase === 2}
            />
            <StepItem
              number={3}
              text="Finalize your profile"
              active={activePhase === 3}
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* 4. Right Column (Sign Up / Log In Form) - centered on mobile & desktop */}
      <section
        data-testid="auth-form-column"
        className="flex-1 w-full max-w-[380px] lg:max-w-none flex flex-col items-center justify-center py-4 lg:py-6 px-2 sm:px-6 lg:px-12 xl:px-16 lg:h-full lg:overflow-y-auto relative my-auto lg:my-0"
      >
        <div data-testid="auth-form-wrapper" className="w-full max-w-[380px] flex flex-col justify-center">
          <div
            data-testid="auth-top-bar"
            className="w-full absolute top-4 sm:top-5 left-0 right-0 max-w-[380px] mx-auto px-1 flex items-center justify-between lg:static lg:top-auto lg:left-auto lg:right-auto lg:mx-0 lg:mb-3 lg:px-0"
          >
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate('/') : (window.location.href = '/'))}
              data-testid="auth-back-home-btn"
              className={`inline-flex items-center gap-2 text-xs font-medium ${
                isNight ? 'text-white/50 hover:text-white' : 'text-[#14202f]/60 hover:text-[#14202f]'
              } transition-colors cursor-pointer`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Teralio</span>
            </button>
            <div className="flex items-center gap-2">
              {/* Theme Toggle Pill */}
              <button
                type="button"
                onClick={toggleTimeOfDay}
                data-testid="auth-theme-toggle-btn"
                aria-label={isNight ? 'Switch to Morning theme' : 'Switch to Night theme'}
                title={isNight ? 'Switch to Morning theme' : 'Switch to Night theme'}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors cursor-pointer ${
                  isNight
                    ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                    : 'bg-black/5 text-[#14202f]/70 hover:bg-black/10 hover:text-[#14202f]'
                }`}
              >
                {isNight ? <SunIcon size={14} /> : <MoonIcon size={14} />}
              </button>
              <div className="flex lg:hidden items-center gap-1.5">
                <Circle className={`w-3.5 h-3.5 ${isNight ? 'fill-white text-white' : 'fill-[#14202f] text-[#14202f]'}`} />
                <span className={`text-xs font-semibold tracking-tight ${isNight ? 'text-white' : 'text-[#14202f]'}`}>
                  Teralio
                </span>
              </div>
            </div>
          </div>

          <motion.div
            variants={formContainerVariants}
            initial="hidden"
            animate="visible"
            className="w-full space-y-5 lg:space-y-5.5"
          >
            {/* Header */}
            <motion.div variants={formItemVariants} className="space-y-1.5">
              <h2 className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isNight ? 'text-white' : 'text-[#14202f]'}`}>
                {isLogin ? 'Welcome Back' : 'Create New Profile'}
              </h2>
              <p className={`text-xs sm:text-sm ${isNight ? 'text-white/40' : 'text-[#667587]'}`}>
                {isLogin
                  ? 'Input your credentials to access your Teralio space.'
                  : 'Input your basic details to begin the journey.'}
              </p>
            </motion.div>

            {/* Social Buttons */}
            <motion.div variants={formItemVariants} className="grid grid-cols-2 gap-3">
              <SocialButton
                icon={<ChromeIcon />}
                label="Google"
                disabled={loading || Boolean(socialLoading)}
                loading={socialLoading === 'Google'}
                onClick={() => handleSocialAuth('Google')}
                isNight={isNight}
              />
              <SocialButton
                icon={<GithubIcon />}
                label="Github"
                disabled={loading || Boolean(socialLoading)}
                loading={socialLoading === 'Github'}
                onClick={() => handleSocialAuth('Github')}
                isNight={isNight}
              />
            </motion.div>

            {/* Divider */}
            <motion.div variants={formItemVariants} className="relative flex items-center justify-center my-0.5">
              <div className={`w-full border-t ${isNight ? 'border-white/10' : 'border-[#14202f]/12'}`} />
              <span className={`absolute px-3 text-[11px] font-medium uppercase tracking-widest ${
                isNight ? 'bg-black text-white/40' : 'bg-[#f2f4ef] text-[#14202f]/50'
              }`}>
                Or
              </span>
            </motion.div>

            {/* Feedback Alert */}
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
                data-testid="auth-status-banner"
                className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-xs leading-relaxed border ${
                  statusMessage.type === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {statusMessage.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
                {statusMessage.type === 'success' && onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('/')}
                    className="shrink-0 underline font-semibold text-white hover:text-white/80 cursor-pointer"
                  >
                    Open Workspace
                  </button>
                )}
              </motion.div>
            )}

            {/* Form Layout */}
            <motion.form variants={formItemVariants} onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              {!isLogin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputGroup
                    label="First Name"
                    name="firstName"
                    placeholder="eg. Arief"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    isNight={isNight}
                  />
                  <InputGroup
                    label="Last Name"
                    name="lastName"
                    placeholder="eg. Pratama"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    isNight={isNight}
                  />
                </div>
              )}

              <InputGroup
                label="Email"
                name="email"
                type="email"
                placeholder="eg. arief@example.com"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange('email')}
                isNight={isNight}
              />

              <InputGroup
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={formData.password}
                onChange={handleInputChange('password')}
                helperText={!isLogin ? 'Requires at least 8 symbols.' : undefined}
                isNight={isNight}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    data-testid="toggle-password-btn"
                    className={`${isNight ? 'text-white/40 hover:text-white' : 'text-[#14202f]/50 hover:text-[#14202f]'} transition-colors cursor-pointer`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading || Boolean(socialLoading)}
                data-testid="auth-submit-btn"
                className={`w-full h-11 sm:h-12 font-semibold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed ${
                  isNight
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-[#0d1117] text-white hover:bg-[#1f2937]'
                }`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isLogin ? 'Log In' : 'Create Account'}</span>
              </button>

              <p className={`text-center text-xs sm:text-sm pt-1 ${isNight ? 'text-white/40' : 'text-[#667587]'}`}>
                {isLogin ? (
                  <>
                    New to Teralio?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      data-testid="switch-to-signup-btn"
                      className={`font-medium hover:underline cursor-pointer ${isNight ? 'text-white' : 'text-[#14202f]'}`}
                    >
                      Create New Profile
                    </button>
                  </>
                ) : (
                  <>
                    Member of the team?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      data-testid="switch-to-login-btn"
                      className={`font-medium hover:underline cursor-pointer ${isNight ? 'text-white' : 'text-[#14202f]'}`}
                    >
                      Log in
                    </button>
                  </>
                )}
              </p>
            </motion.form>
          </motion.div>
        </div>
      </section>
    </motion.main>
  );
}

// Re-export subcomponents for exact modular compatibility
export { StepItem, SocialButton, InputGroup };
