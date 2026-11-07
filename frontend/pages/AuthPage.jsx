import React, { useState } from 'react';
import { Link, useRouter } from '../context/RouterContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { BRAND, MEDIA_ASSETS, AUTH_PHASES } from '../data/teralioData.js';
import StepItem from '../components/auth/StepItem.jsx';
import SocialButton from '../components/auth/SocialButton.jsx';
import InputGroup from '../components/auth/InputGroup.jsx';
import {
  CircleFillIcon,
  ChromeIcon,
  GitHubIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowLeftIcon,
  SunIcon,
  MoonIcon,
} from '../components/Icons.jsx';

export function AuthPage({ mode = 'signup' }) {
  const isLogin = mode === 'login';
  const { navigate } = useRouter();
  const { isNight, toggleTimeOfDay } = useTheme();

  const [activePhase, setActivePhase] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [feedback, setFeedback] = useState('');

  const handleField = (field) => (e) => {
    setFeedback('');
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSocialAuth = (provider) => {
    setActivePhase(3);
    setFeedback(`${provider} workspace handshake ready. Redirecting to your Teralio console...`);
    setTimeout(() => {
      navigate('/customers');
    }, 650);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setFeedback('Password requires at least 8 symbols.');
      return;
    }

    if (!isLogin && activePhase < 3) {
      const nextPhase = activePhase + 1;
      setActivePhase(nextPhase);
      setFeedback(
        nextPhase === 2
          ? 'Identity verified. Phase 2 active: studio & gateway parameters linked.'
          : 'Profile finalized. Welcome to Teralio—you can now launch the Customer Console.'
      );
      return;
    }

    setFeedback(
      isLogin
        ? `Signed in as ${form.email || 'member'}. Opening Teralio console...`
        : `Account created for ${form.firstName || form.email}. Welcome to Teralio.`
    );
  };

  return (
    <main className="auth-page" data-testid="auth-page">
      {/* Left Column — Pure Unmasked Background Video & Staggered Onboarding Hero */}
      <section className="auth-hero" aria-label={`Join ${BRAND.name}`}>
        <video
          className="auth-hero__video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={MEDIA_ASSETS.authVideo} type="video/mp4" />
        </video>

        <div className="auth-hero__content">
          <div className="auth-brand-row auth-stagger-item auth-stagger-1">
            <CircleFillIcon className="auth-brand-circle" />
            <span>{BRAND.name}</span>
          </div>

          <div className="auth-hero__heading-group auth-stagger-item auth-stagger-2">
            <h1 className="auth-hero__title">Join {BRAND.name}</h1>
            <p className="auth-hero__subtitle">
              Follow these 3 quick phases to activate your space.
            </p>
          </div>

          <div className="auth-steps-stack auth-stagger-item auth-stagger-3">
            {AUTH_PHASES.map((phase) => (
              <StepItem
                key={phase.number}
                number={phase.number}
                text={phase.text}
                active={activePhase === phase.number}
                onClick={() => setActivePhase(phase.number)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Right Column — Theme-Adaptive Sign Up / Log In Form */}
      <section className="auth-panel">
        <div className="auth-panel__topbar">
          <Link to="/" className="auth-back-link">
            <ArrowLeftIcon />
            <span>Back to {BRAND.name}</span>
          </Link>

          <button
            type="button"
            className="auth-theme-btn"
            onClick={toggleTimeOfDay}
            aria-label="Toggle light and dark theme"
          >
            {isNight ? <SunIcon /> : <MoonIcon />}
            <span>{isNight ? 'Light Theme' : 'Dark Theme'}</span>
          </button>
        </div>

        <div className="auth-panel__inner">
          <header>
            <h2 className="auth-header__title">
              {isLogin ? `Sign In to ${BRAND.name}` : 'Create New Profile'}
            </h2>
            <p className="auth-header__subtitle">
              {isLogin
                ? 'Enter your credentials to inspect real-time roof & controller telemetry.'
                : 'Input your basic details to begin the journey.'}
            </p>
          </header>

          <div className="auth-social-grid">
            <SocialButton
              icon={<ChromeIcon />}
              label="Google"
              onClick={() => handleSocialAuth('Google')}
            />
            <SocialButton
              icon={<GitHubIcon />}
              label="Github"
              onClick={() => handleSocialAuth('GitHub')}
            />
          </div>

          <div className="auth-divider" aria-hidden="true">
            <span>Or</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="auth-form-row">
                <InputGroup
                  id="auth-first-name"
                  label="First Name"
                  placeholder="Astrid"
                  value={form.firstName}
                  onChange={handleField('firstName')}
                  autoComplete="given-name"
                  required
                />
                <InputGroup
                  id="auth-last-name"
                  label="Last Name"
                  placeholder="Holmstrom"
                  value={form.lastName}
                  onChange={handleField('lastName')}
                  autoComplete="family-name"
                  required
                />
              </div>
            )}

            <InputGroup
              id="auth-email"
              label="Email"
              type="email"
              placeholder="astrid@teralio.energy"
              value={form.email}
              onChange={handleField('email')}
              autoComplete="email"
              required
            />

            <InputGroup
              id="auth-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={form.password}
              onChange={handleField('password')}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              helperText="Requires at least 8 symbols."
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
            />

            {feedback && (
              <div className="auth-status-banner" role="status">
                {feedback}{' '}
                {activePhase === 3 && (
                  <Link to="/customers" className="auth-switch-link">
                    Open Console →
                  </Link>
                )}
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              {isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch-row">
            {isLogin ? 'Need a new workspace?' : 'Member of the team?'}
            <Link to={isLogin ? '/signup' : '/login'} className="auth-switch-link">
              {isLogin ? 'Create Account' : 'Log in'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
