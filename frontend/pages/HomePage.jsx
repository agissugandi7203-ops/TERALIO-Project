import React, { useState } from 'react';
import HeroFogScene from '../components/HeroFogScene.jsx';
import CaseResultsSection from '../components/CaseResultsSection.jsx';
import PricingSection from '../components/PricingSection.jsx';
import TestimonialsSection from '../components/TestimonialsSection.jsx';
import FaqSection from '../components/FaqSection.jsx';
import {
  ArrowUpRightIcon,
} from '../components/Icons.jsx';
import { useAtmosphere } from '../context/AtmosphereContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import {
  HOW_IT_WORKS_STAGES,
  TECHNICAL_SPECS,
} from '../data/teralioContent.js';

const ARCHITECTURE_STAGES = [
  {
    step: '01',
    title: 'Full-Surface Solar Roof Synthesis',
    description:
      'Instead of bolting aluminum racks onto aging shingles, Teralio replaces or integrates flush charcoal solar tiles with color-matched inactive perimeter tiles—turning every sunlit plane into an architectural generator.',
  },
  {
    step: '02',
    title: 'High-Density LiFePO4 Energy Vault',
    description:
      'Liquid-regulated lithium iron phosphate modules maintain optimal thermal performance from -25°C winter frost to +48°C summer heatwaves, delivering 10,000+ deep cycles without fire propagation risk.',
  },
  {
    step: '03',
    title: 'Teralio Smart Controller V4',
    description:
      'Connected directly to regional day-ahead electricity exchanges and satellite irradiance models, the Smart Controller turns excess daytime harvest into monetary credits that neutralize dark winter weeks.',
  },
  {
    step: '04',
    title: '84-Month Zero-Bill Settlement',
    description:
      'Teralio becomes your single automated energy steward. Every month for 7 years, your statement reads $0.00—and after year 7, you own an asset still operating above 92% rated capacity.',
  },
];

const HARDWARE_BLUEPRINT_SPECS = [
  'Matte Charcoal Obsidian (Low-Glare AR Satin)',
  'N-Type Back-Contact Monocrystalline Silicon',
  'UL 2218 Class 4 (50mm steel sphere) • 210 km/h wind uplift',
  'Dual ARM Cortex-A76 Edge NPU + Dual-SIM LTE/Wi-Fi 6',
  'Automotive-grade Prismatic LiFePO4 (0% Cobalt)',
  '7.4 milliseconds (flicker-free medical & server grade)',
  '-30°C to +55°C with active self-warming winter loop',
  '84 consecutive billing cycles at $0.00 net homeowner cost',
];

export function HomePage() {
  const { isNight } = useAtmosphere();
  const { navigate } = useRouter();

  const handlePrimaryAction = () => {
    navigate('/login');
  };

  return (
    <div className="home-page" data-testid="home-page">
      {/* 1. Hero Section: Lumen Roof 3D Fog Scene & $0 Electric Bills Guarantee */}
      <section id="hero" aria-label="Lumen Roof Hero">
        <HeroFogScene />
      </section>

      {/* 2. How It Works Section: 4-Stage Autonomous Power Architecture & Hardware Blueprint Points */}
      <section
        id="how-it-works"
        className="home-section landing-section"
        data-testid="how-it-works-page"
      >
        <div className="section-shell">
          <div className="section-header-split">
            <div>
              <span className="eyebrow-pill">Autonomous Power Architecture</span>
              <h2 className="section-title">
                Three Integrated Layers. <i className="split-muted">Zero Grid Invoices.</i>
              </h2>
            </div>
            <p className="section-lead max-w-lg">
              Teralio transforms private residential properties into self-arbitraging micropower
              plants using integrated solar tile architecture and predictive weather telemetry.
            </p>
          </div>

          {/* 4 Architectural Stages (01 - 04) */}
          <div className="arch-stages-grid">
            {ARCHITECTURE_STAGES.map((stage) => (
              <article key={stage.step} className="arch-stage-card">
                <div className="arch-stage-header">
                  <span className="arch-stage-num">{stage.step}</span>
                  <div className="arch-stage-line" />
                </div>
                <h3 className="arch-stage-title">{stage.title}</h3>
                <p className="arch-stage-desc">{stage.description}</p>
              </article>
            ))}
          </div>

          {/* Hardware Blueprint — Microgrid Technical Specifications Point List */}
          <div className="hardware-blueprint-panel">
            <div className="blueprint-top-bar">
              <div>
                <span className="eyebrow-pill">Hardware Blueprint</span>
                <h3 className="blueprint-heading">
                  Microgrid Technical Specifications
                </h3>
              </div>
              <button
                type="button"
                className="ghost-pill-btn"
                onClick={handlePrimaryAction}
              >
                <span>Download Engineering Packet</span>
                <ArrowUpRightIcon size={14} />
              </button>
            </div>

            <div className="blueprint-points-grid">
              {HARDWARE_BLUEPRINT_SPECS.map((specText, idx) => (
                <div key={`spec-point-${idx}`} className="blueprint-point-item">
                  <span className="blueprint-point-dot" />
                  <span className="blueprint-point-text">{specText}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Our Cases Section: Elo One Results Section with Sunset Orange Cards */}
      <section id="cases" className="home-section landing-section" data-testid="our-cases-page">
        <div className="section-shell">
          <CaseResultsSection />
        </div>
      </section>

      {/* 4 & 5. Pricing & Testimonials Sections: Menyatu Seamless Sebagai Satu Kesatuan Visual */}
      <div id="pricing-testimonials-block" className="w-full relative" data-testid="careers-page">
        {/* Pricing Section (Menggantikan Careers) */}
        <PricingSection onAction={handlePrimaryAction} />

        {/* Testimonials Section (Menyambung langsung dengan halaman atas) */}
        <TestimonialsSection onAction={handlePrimaryAction} />
      </div>

      {/* 6. FAQ Section: FAQ dengan Dropdown Accordion Halus */}
      <FaqSection onAction={handlePrimaryAction} />
    </div>
  );
}

export default HomePage;
