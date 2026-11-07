import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAtmosphere } from '../context/AtmosphereContext.jsx';

export function PricingSection({ onAction }) {
  const { isNight } = useAtmosphere();
  const [isYearly, setIsYearly] = useState(false);

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      const target = document.getElementById('get-started');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      id="pricing"
      data-testid="pricing-section"
      className="relative w-full overflow-hidden transition-colors duration-500"
      style={{
        padding: '100px 0 40px',
        backgroundColor: isNight ? '#0a101d' : '#ffffff',
      }}
    >
      <div className="max-w-[1180px] mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3.5 max-w-2xl mx-auto mb-12">
          {/* PreTitle */}
          <span
            className="inline-flex items-center px-3.5 py-1 text-xs font-semibold rounded-full border transition-colors"
            style={{
              backgroundColor: isNight ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 165, 233, 0.1)',
              borderColor: isNight ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.25)',
              color: isNight ? '#38bdf8' : '#0284c7',
              letterSpacing: '0.04em',
            }}
          >
            Teralio Service Plans
          </span>

          {/* Heading */}
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.14]"
            style={{
              color: isNight ? '#ffffff' : '#111827',
            }}
          >
            Transparent for Students, Efficient for Property Owners
          </h2>

          <p
            className="text-sm sm:text-base font-normal max-w-lg mt-1"
            style={{
              color: isNight ? '#94a3b8' : '#64748b',
            }}
          >
            100% free accommodation discovery for students. Direct-to-owner listings with zero middleman commissions for landlords.
          </p>

          {/* Billing Toggle: Monthly vs Yearly */}
          <div className="flex items-center gap-3 mt-6 p-1 rounded-full border"
            style={{
              backgroundColor: isNight ? '#121d30' : '#f1f5f9',
              borderColor: isNight ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className="px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: !isYearly
                  ? isNight
                    ? '#ffffff'
                    : '#0f172a'
                  : 'transparent',
                color: !isYearly
                  ? isNight
                    ? '#0f172a'
                    : '#ffffff'
                  : isNight
                    ? '#94a3b8'
                    : '#64748b',
                boxShadow: !isYearly ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: isYearly
                  ? isNight
                    ? '#ffffff'
                    : '#0f172a'
                  : 'transparent',
                color: isYearly
                  ? isNight
                    ? '#0f172a'
                    : '#ffffff'
                  : isNight
                    ? '#94a3b8'
                    : '#64748b',
                boxShadow: isYearly ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              <span>Yearly</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500 text-white tracking-wide">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 2 Main Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-8">
          {/* 1. Mahasiswa Plan */}
          <div
            className="rounded-3xl p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 hover:shadow-xl relative"
            style={{
              backgroundColor: isNight ? '#0f1728' : '#ffffff',
              border: isNight ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              boxShadow: isNight
                ? '0 10px 30px -10px rgba(0, 0, 0, 0.4)'
                : '0 10px 25px -10px rgba(0, 0, 0, 0.06)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-xl sm:text-2xl font-bold"
                  style={{ color: isNight ? '#ffffff' : '#111827' }}
                >
                  Students &amp; Seekers
                </h3>
              </div>
              <p
                className="text-sm mb-6"
                style={{ color: isNight ? '#94a3b8' : '#64748b' }}
              >
                Free forever for university students and local room seekers
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 mb-8">
                <span
                  className="text-4xl sm:text-5xl font-extrabold tracking-tight transition-all duration-300"
                  style={{ color: isNight ? '#ffffff' : '#111827' }}
                >
                  Rp0
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: isNight ? '#94a3b8' : '#64748b' }}
                >
                  /forever
                </span>
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={handleAction}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] cursor-pointer mb-8"
                style={{
                  backgroundColor: isNight ? '#1e293b' : '#0f172a',
                  color: '#ffffff',
                }}
              >
                Start Searching for Free
              </button>

              {/* Feature Checklist */}
              <div className="space-y-3.5">
                {[
                  'Conversational AI assistant in natural language (text & voice)',
                  'Curated catalog of 46 verified accommodations in Bandung, Depok & Yogya',
                  'Total living cost estimates (base rent + monthly utilities)',
                  'Google Maps & OSRM walking routes to university campus gates',
                  'Direct WhatsApp contact with property owners (zero middleman)',
                  'Schedule physical survey visits directly to your calendar',
                ].map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isNight ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.12)',
                        color: isNight ? '#38bdf8' : '#0284c7',
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: isNight ? '#cbd5e1' : '#475569' }}
                    >
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Pemilik Kos Plan (Featured Card) */}
          <div
            className="rounded-3xl p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: isNight ? '#141d32' : '#0f172a',
              border: isNight ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(15, 23, 42, 0.8)',
              boxShadow: isNight
                ? '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 20px -5px rgba(56, 189, 248, 0.15)'
                : '0 20px 40px -15px rgba(15, 23, 42, 0.3)',
            }}
          >
            {/* Ambient Top Glow */}
            <div
              className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400"
            />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Property Owners (Direct-to-Owner)
                </h3>
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  Verified Partner
                </span>
              </div>

              <p className="text-sm mb-6 text-slate-300">
                Direct marketing to students with zero broker cuts or commissions
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white transition-all duration-300">
                  {isYearly ? 'Rp39K' : 'Rp49K'}
                </span>
                <span className="text-sm font-medium text-slate-400">
                  /property/mo
                </span>
                {isYearly && (
                  <span className="ml-2 text-xs font-semibold text-emerald-400">
                    (billed yearly)
                  </span>
                )}
              </div>

              {/* Guarantee badges */}
              <div className="flex items-center flex-wrap gap-2 text-[11px] font-medium text-slate-400 mb-8">
                <span>0% Broker Commission</span>
                <span>•</span>
                <span>Direct WhatsApp Contact</span>
                <span>•</span>
                <span>Google Maps Pin Placement</span>
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={handleAction}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] cursor-pointer mb-8 bg-white text-slate-900 shadow-lg"
              >
                List Your Property
              </button>

              {/* Feature Checklist */}
              <div className="space-y-3.5">
                {[
                  'Verified property listing with genuine GPS coordinates',
                  '100% free of middleman commissions per lease agreement',
                  'Direct WhatsApp integration connected to student seekers',
                  'Visit schedule reservation calendar management',
                  'Priority recommendations in AI assistant conversations',
                  'Verified property badge & tenant interest analytics',
                ].map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500/20 text-cyan-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-slate-200">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Enterprise Plan Banner */}
        <div
          className="rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300"
          style={{
            backgroundColor: isNight ? '#0d1525' : '#f8fafc',
            border: isNight ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          }}
        >
          <div className="max-w-xl text-center md:text-left">
            <h4
              className="text-lg sm:text-xl font-bold mb-1.5"
              style={{ color: isNight ? '#ffffff' : '#111827' }}
            >
              Campus &amp; Housing Management Partnerships
            </h4>
            <p
              className="text-sm font-normal"
              style={{ color: isNight ? '#94a3b8' : '#64748b' }}
            >
              Official living curation programs for universities to streamline onboarding for new and exchange students.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAction}
            className="flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border"
            style={{
              backgroundColor: isNight ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
              borderColor: isNight ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
              color: isNight ? '#ffffff' : '#0f172a',
            }}
          >
            Contact Teralio Team
          </button>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
