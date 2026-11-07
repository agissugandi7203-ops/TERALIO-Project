import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { useAtmosphere } from '../context/AtmosphereContext.jsx';

export const FAQ_ITEMS = [
  {
    q: 'What is the maximum amount I can send?',
    a: 'Transfer limits vary by payment method and destination country. You can check specific limits in your account dashboard.',
  },
  {
    q: 'Does my recipient need an account?',
    a: "No, your recipient doesn't need an account. Funds can be sent directly to their bank account or mobile wallet.",
  },
  {
    q: 'Is there a mobile app available?',
    a: 'Yes, our mobile app is available for both iOS and Android. You can download it from the App Store or Google Play Store.',
  },
  {
    q: 'Can I cancel a transfer?',
    a: "You can cancel a transfer if it hasn't been processed yet. Go to your transaction history and select the cancel option.",
  },
  {
    q: 'What currencies are supported?',
    a: 'We support over 50 currencies for transfers to more than 130 countries worldwide.',
  },
];

export function FaqTransferSection({ onAction }) {
  const { isNight } = useAtmosphere();
  const [activeIndex, setActiveIndex] = useState(0);
  const [btnHovered, setBtnHovered] = useState(false);

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <section
      id="faq"
      data-testid="resources-page"
      className="home-section landing-section"
      style={{
        padding: '70px 0 110px',
        backgroundColor: isNight ? '#070d18' : '#f8fafc',
        transition: 'background-color 0.35s ease',
      }}
    >
      <div className="faq-wide-shell">
        <div
          className={`faq-transfer-container ${isNight ? 'is-night' : 'is-morning'}`}
          style={{
            backgroundColor: isNight ? '#0c1424' : '#ffffff',
            borderColor: isNight ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
            color: isNight ? '#f8fafc' : '#0f172a',
          }}
        >
          {/* Main Section */}
          <main className="faq-transfer-main">
            <div className="faq-transfer-grid">
              {/* Left column — Animated Gradient CTA card */}
              <div
                className="faq-cta-column c5-animated-gradient"
                style={{
                  boxShadow: isNight
                    ? '0 16px 44px rgba(0, 0, 0, 0.55)'
                    : '0 12px 32px rgba(0, 0, 0, 0.12)',
                }}
              >
                <h2
                  className="font-normal leading-[1.1] mb-[15px]"
                  style={{
                    fontSize: 'clamp(2.3rem, 4vw, 3.5rem)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Ready to Transfer
                  <br />
                  Without Borders?
                </h2>

                <p className="text-[0.92rem] md:text-[0.98rem] mb-[30px] font-normal opacity-90 max-w-md leading-relaxed">
                  Send Money Worldwide at the Best Rates
                </p>

                <button
                  type="button"
                  onClick={handleAction}
                  className="bg-neutral-900 text-white font-semibold cursor-pointer border-none text-[0.95rem] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-2"
                  style={{
                    padding: '14px 32px',
                    borderRadius: '12px',
                    boxShadow: btnHovered
                      ? '0 14px 30px rgba(0,0,0,0.45)'
                      : '0 10px 20px rgba(0,0,0,0.3)',
                  }}
                  onMouseEnter={() => setBtnHovered(true)}
                  onMouseLeave={() => setBtnHovered(false)}
                >
                  <span>Get Started Today</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Right column — FAQ accordion dengan animasi dropdown buka-tutup halus */}
              <div className="faq-accordion-column">
                {FAQ_ITEMS.map((item, index) => {
                  const isActive = activeIndex === index;
                  return (
                    <div
                      key={item.q}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isActive}
                      className={`faq-accordion-tile ${isActive ? 'is-active' : ''}`}
                      style={{
                        backgroundColor: isNight
                          ? isActive
                            ? '#16233b'
                            : '#111b2e'
                          : isActive
                            ? '#ffffff'
                            : '#f8fafc',
                        borderColor: isNight
                          ? isActive
                            ? 'rgba(56, 189, 248, 0.55)'
                            : 'rgba(255, 255, 255, 0.08)'
                          : isActive
                            ? '#cbd5e1'
                            : '#e2e8f0',
                      }}
                      onClick={() => toggleFaq(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleFaq(index);
                        }
                      }}
                    >
                      <div className="faq-tile-header">
                        <span
                          className="faq-tile-question"
                          style={{
                            color: isNight
                              ? isActive
                                ? '#ffffff'
                                : '#f1f5f9'
                              : isActive
                                ? '#0f172a'
                                : '#1e293b',
                          }}
                        >
                          {item.q}
                        </span>
                        <span
                          className="faq-tile-chevron"
                          style={{
                            transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        >
                          <ChevronDown
                            size={20}
                            style={{
                              color: isNight
                                ? isActive
                                  ? '#38bdf8'
                                  : '#94a3b8'
                                : isActive
                                  ? '#0f172a'
                                  : '#64748b',
                              transition: 'color 0.25s ease',
                            }}
                          />
                        </span>
                      </div>

                      {/* Smooth Animated Height Drawer */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateRows: isActive ? '1fr' : '0fr',
                          transition: 'grid-template-rows 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              opacity: isActive ? 1 : 0,
                              transform: isActive ? 'translateY(0)' : 'translateY(-6px)',
                              transition: 'opacity 0.28s ease, transform 0.28s ease',
                              paddingTop: '12px',
                              paddingBottom: '4px',
                              marginTop: '10px',
                              borderTop: isNight
                                ? '1px solid rgba(255, 255, 255, 0.08)'
                                : '1px solid #f1f5f9',
                              color: isNight ? '#94a3b8' : '#475569',
                              fontSize: '0.925rem',
                              lineHeight: 1.65,
                            }}
                          >
                            <p>{item.a}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

export const CustomerTransferSection = FaqTransferSection;
export default FaqTransferSection;
