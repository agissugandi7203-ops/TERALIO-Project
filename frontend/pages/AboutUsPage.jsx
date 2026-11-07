import React from 'react';
import { Link } from '../context/RouterContext.jsx';
import { BRAND, MEDIA_ASSETS } from '../data/teralioData.js';
import { ArrowRightIcon } from '../components/Icons.jsx';

const LEADERSHIP = [
  {
    code: 'CEO',
    name: 'Astrid Holmström',
    role: 'Co-Founder & Chief Executive Officer',
    bio: 'Former VP of Nordic Grid Flexibility at Vattenfall; 14 years scaling residential renewable microgrids.',
  },
  {
    code: 'CTO',
    name: 'Dr. Matteo Bernasconi',
    role: 'Co-Founder & Chief Technology Officer',
    bio: 'ETH Zurich Power Electronics PhD; led silicon-carbide inverter architecture & BIPV cell encapsulation.',
  },
  {
    code: 'ARCH',
    name: 'Soren Lindahl',
    role: 'Head of Architectural Envelope',
    bio: 'Master timber & slate restoration architect; designed Teralio’s zero-conduit interlocking flashing system.',
  },
];

export function AboutUsPage() {
  return (
    <main data-testid="about-us-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">About {BRAND.name}</span>
          <h1 className="display-title">
            Roofing craft meets <em>autonomous grid intelligence.</em>
          </h1>
          <p className="lead-copy">
            We founded {BRAND.name} on a clear conviction: homeowners shouldn’t have to bolt
            aluminum racks onto an architectural roof—or decipher volatile kilowatt-hour
            tariffs—just to achieve energy independence.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2 grid-2--center">
            <div className="stack-md">
              <div>
                <span className="eyebrow">01 — Actuarial Economics</span>
                <h2 className="section-title">
                  We absorb the weather and market risk so you never have to.
                </h2>
              </div>
              <p className="card-body card-body--lg">
                Traditional solar installers sell panels and walk away—leaving homeowners exposed
                when winter clouds roll in or utilities slash daytime net-metering credits.
              </p>
              <p className="card-body card-body--lg">
                Because {BRAND.name} engineers the entire roofline, oversized LFP storage, and
                real-time wholesale bidding controller together, every {BRAND.name} residence
                generates surplus arbitrage revenue during grid stress hours. We pool that
                fleet-wide reserve to contractually guarantee a{' '}
                <strong>$0.00 electricity bill for 84 months</strong>.
              </p>
              <div className="flex-row-wrap">
                <Link to="/how-it-works" className="btn-pill">
                  <span>See Technical Architecture</span>
                  <ArrowRightIcon />
                </Link>
                <Link to="/careers" className="btn-pill btn-pill--ghost">
                  <span>View Open Engineering Roles</span>
                  <ArrowRightIcon />
                </Link>
              </div>
            </div>

            <div className="visual-house-preview visual-house-preview--tall">
              <img
                src={MEDIA_ASSETS.hero.groundMorning}
                alt="Teralio farmhouse craftsmanship"
                className="is-visible"
              />
              <div className="visual-house-overlay">
                <span className="visual-pill">Founded 2021 &bull; Stockholm &amp; Zurich</span>
              </div>
              <div className="visual-house-bottom">
                <div className="appliance-title">4,800+ Architectural Roofs Commissioned</div>
                <div className="card-body">
                  Zero structural leaks &bull; 100% zero-bill contract fulfillment
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">02 — Leadership</span>
              <h2 className="section-title">Built by roofers, physicists, and grid traders</h2>
            </div>
          </div>

          <div className="grid-3">
            {LEADERSHIP.map((person) => (
              <article className="glass-card" key={person.name}>
                <span className="card-index">{person.code}</span>
                <div>
                  <h3 className="card-heading">{person.name}</h3>
                  <div className="card-role">{person.role}</div>
                </div>
                <p className="card-body">{person.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">03 — Global Engineering Hubs</span>
              <h2 className="section-title">Designed and tested for extreme climates</h2>
            </div>
          </div>

          <div className="grid-3">
            <div className="glass-card">
              <span className="card-index">SE — 59.3°N</span>
              <h3 className="card-heading">Stockholm, Sweden</h3>
              <p className="card-body">
                Architectural glass-slate tooling lab, sub-zero snow-shedding environmental chambers,
                and Nordic roof installation academy.
              </p>
            </div>
            <div className="glass-card">
              <span className="card-index">CH — 47.4°N</span>
              <h3 className="card-heading">Zurich, Switzerland</h3>
              <p className="card-body">
                Silicon-carbide power electronics R&amp;D and quantitative wholesale energy
                forecasting for European spot markets.
              </p>
            </div>
            <div className="glass-card">
              <span className="card-index">US — 30.3°N</span>
              <h3 className="card-heading">Austin, Texas</h3>
              <p className="card-body">
                North American UL testing facility, ERCOT/CAISO/NYISO Virtual Power Plant operations
                center, and homeowner support.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AboutUsPage;
