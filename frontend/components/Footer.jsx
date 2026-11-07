import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useRouter } from '../context/RouterContext.jsx';
import {
  BRAND,
  MEDIA_ASSETS,
  FOOTER_NAV_COLUMNS,
  FOOTER_SOCIAL_LINKS,
} from '../data/teralioData.js';
import { LuckyCurvedArrow, SocialIconByName } from './Icons.jsx';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const svgRef = useRef(null);
  const textRef = useRef(null);
  const { navigate } = useRouter();

  const fitWatermark = useCallback(() => {
    const svg = svgRef.current;
    const text = textRef.current;
    if (!svg || !text || typeof text.getBBox !== 'function') return;
    try {
      const bbox = text.getBBox();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      }
    } catch {
      // Ignore getBBox errors in headless environments
    }
  }, []);

  useEffect(() => {
    fitWatermark();
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitWatermark).catch(() => {});
    }
    window.addEventListener('resize', fitWatermark);
    return () => window.removeEventListener('resize', fitWatermark);
  }, [fitWatermark]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <section className="footer-section" data-testid="teralio-footer">
      <div className="footer-wrapper">
        {/* Left Card — Pure Autoplay Video Background */}
        <div className="footer-left">
          <video
            className="footer-left-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src={MEDIA_ASSETS.footerVideo} type="video/mp4" />
          </video>

          <Link to="/" className="footer-logo" aria-label={`${BRAND.name} Home`}>
            <div className="footer-logo-mark">{BRAND.mark}</div>
            <span className="footer-logo-name">{BRAND.name}</span>
          </Link>

          <div className="footer-tagline-container">
            <p className="footer-tagline">
              {BRAND.taglineLead}
              <br />
              <span>{BRAND.taglineAccent}</span>
            </p>
          </div>

          <div className="footer-social-row">
            <span className="footer-social-label">{BRAND.stayInTouchLabel}</span>
            <div className="footer-social-icons">
              {FOOTER_SOCIAL_LINKS.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="social-icon"
                  aria-label={social.label}
                >
                  <SocialIconByName id={social.id} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card — Floating Lucky Cube, Caveat Nav Columns, Subscribe */}
        <div className="footer-right">
          <div className="footer-lucky-graphic">
            <button
              type="button"
              className="lucky-cube"
              onClick={() => navigate('/signup')}
              aria-label={`${BRAND.feelingLuckyLabel} Join ${BRAND.name}`}
            >
              <span className="lucky-cube-mark">{BRAND.mark}</span>
            </button>
            <div className="lucky-text-row">
              <LuckyCurvedArrow />
              <span className="lucky-text">{BRAND.feelingLuckyLabel}</span>
            </div>
          </div>

          <div className="footer-right-top">
            <div className="footer-nav-cols">
              {FOOTER_NAV_COLUMNS.map((col) => (
                <div className="footer-col" key={col.title}>
                  <h3 className="footer-col-title">{col.title}</h3>
                  {col.links.map((link) => (
                    <Link key={link.label} to={link.to}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              &copy; {BRAND.copyrightYear} {BRAND.name}. All rights reserved.
            </p>

            <div className="footer-cta-mini">
              <h4 className="footer-cta-heading">
                {BRAND.subscribePromptLead}
                <br />
                <strong>{BRAND.subscribePromptStrong}</strong>
              </h4>

              <form className="footer-subscribe-row" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  className="footer-subscribe-input"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => {
                    setSubscribed(false);
                    setEmail(e.target.value);
                  }}
                  aria-label="Enter email address"
                />
                <button type="submit" className="footer-subscribe-btn">
                  {subscribed ? 'Subscribed ✓' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Fluid Edge-to-Edge Watermark */}
      <div className="footer-watermark" aria-hidden="true">
        <svg
          ref={svgRef}
          id="watermarkSvg"
          viewBox="62 95 876 175"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <text ref={textRef} id="watermarkText" x="500" y="240" textAnchor="middle" fontSize="320">
            {BRAND.name}
          </text>
        </svg>
      </div>
    </section>
  );
}

export default Footer;
