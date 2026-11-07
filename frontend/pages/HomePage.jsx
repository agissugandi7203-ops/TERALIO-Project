import React, { useState, useEffect } from 'react';
import HeroFogScene from '../components/HeroFogScene.jsx';
import Header from '../components/Header.jsx';
import DayNightController from '../components/DayNightController.jsx';
import { Link, useRouter } from '../context/RouterContext.jsx';
import { PROOF_METRICS, CASE_STUDIES, MEDIA_ASSETS } from '../data/teralioData.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { ArrowRightIcon } from '../components/Icons.jsx';

const ARCHITECTURE_ROWS = [
  {
    num: '01 / 03',
    title: 'Charcoal Solar Slate',
    sub: 'Structural Building Envelope',
    desc: 'Edge-to-edge tempered matte glass replaces conventional shingles down to the decking. Color-matched active and perimeter courses preserve clean Nordic gable geometry with zero exposed aluminum racks.',
    specs: [
      '23.8% N-Type TOPCon cell yield',
      '21.4 kg/m² dead load (lighter than slate)',
      'UL 790 Class A fire & Class 4 hail rated',
    ],
  },
  {
    num: '02 / 03',
    title: 'Teralio LFP Vault',
    sub: 'Cobalt-Free Thermal Storage',
    desc: 'Modular prismatic lithium iron phosphate stacks mount flush inside garage or utility walls, banking cheap midday photons to run hydronic heat pumps and dual EV chargers through sub-zero nights.',
    specs: [
      '14.4 to 57.6 kWh modular capacity',
      'Self-warming operation down to -25°C',
      '10,000-cycle architectural endurance',
    ],
  },
  {
    num: '03 / 03',
    title: 'AI Smart Controller',
    sub: 'Wholesale VPP & Zero-Bill Engine',
    desc: 'Predicting local barometric cloud cover against 15-minute wholesale spot tariffs, our Silicon-Carbide gateway sells evening grid surges automatically—funding 84 consecutive months of $0 bills.',
    specs: [
      '< 10 ms solid-state blackout islanding',
      'Automated NordPool / EPEX / ISO bidding',
      'Contractual 7-year $0 utility settlement',
    ],
  },
];

export const HomePage = () => {
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [monthlyBill, setMonthlyBill] = useState(265);
  const { navigate } = useRouter();
  const { isNight } = useTheme();
  const { hero } = MEDIA_ASSETS;

  useEffect(() => {
    const onScroll = () => {
      const threshold = (window.innerHeight || 720) * 0.82;
      setScrolledPastHero(window.scrollY > threshold);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sevenYearSavings = Math.round(monthlyBill * 12 * 7.95);

  return (
    <div data-testid="home-page">
      <Header floating visible={scrolledPastHero} />

      {/* Full-Viewport Morning / Night WebGL2 Fog Hero */}
      <HeroFogScene />

      {/* Section 1: Hairline Swiss Architectural Proof Ledger */}
      <section className="section--ledger" aria-label="Verified performance specifications">
        <div className="container">
          <div className="proof-ledger">
            {PROOF_METRICS.map((m) => (
              <div className="proof-ledger__cell" key={m.label}>
                <div className="proof-ledger__value">{m.value}</div>
                <div className="proof-ledger__label">{m.label}</div>
                <p className="proof-ledger__detail">{m.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Asymmetric Editorial System Specification */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">01 — Integrated Architecture</span>
              <h2 className="section-title">
                One roofline. Zero bolt-on racks.
                <br />
                Seven years of $0 bills.
              </h2>
            </div>
            <Link to="/how-it-works" className="btn-pill btn-pill--ghost">
              <span>Explore System Engineering</span>
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="arch-rows">
            {ARCHITECTURE_ROWS.map((row) => (
              <article className="arch-row" key={row.num}>
                <div className="arch-row__num">{row.num}</div>
                <div>
                  <h3 className="arch-row__title">{row.title}</h3>
                  <span className="arch-row__sub">{row.sub}</span>
                </div>
                <p className="arch-row__desc">{row.desc}</p>
                <ul className="arch-row__specs">
                  {row.specs.map((sp) => (
                    <li key={sp}>{sp}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Interactive 24-Hour Smart Controller Console */}
      <section className="section section--alt">
        <div className="container">
          <DayNightController />
        </div>
      </section>

      {/* Section 4: Audited Residential Installations */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">03 — Audited Field Ledger</span>
              <h2 className="section-title">From Nordic snowstorms to Pacific fog.</h2>
              <p className="lead-copy">
                Real residences running heat pumps, induction kitchens, and electric vehicles with
                verified $0.00 utility statements.
              </p>
            </div>
            <Link to="/our-cases" className="btn-pill btn-pill--ghost">
              <span>Inspect All 6 Case Audits</span>
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="grid-3">
            {CASE_STUDIES.slice(0, 3).map((cs) => (
              <article className="case-card" key={cs.id}>
                <div className="case-card__media">
                  <img
                    src={
                      isNight
                        ? cs.preferNightImg
                          ? hero.groundNight
                          : hero.groundMorning
                        : cs.preferNightImg
                        ? hero.groundMorning
                        : hero.groundNight
                    }
                    alt={cs.title}
                  />
                  <span className="case-card__badge">{cs.climate}</span>
                  <span className="case-card__zero">{cs.currentBill} Verified</span>
                </div>
                <div className="case-card__content">
                  <div>
                    <div className="case-card__meta">{cs.location}</div>
                    <h3 className="card-heading">{cs.title}</h3>
                  </div>
                  <p className="card-body">“{cs.quote}”</p>
                  <div className="case-metrics-row">
                    <div>
                      <small>Array</small>
                      <strong>{cs.systemSize}</strong>
                    </div>
                    <div>
                      <small>Vault</small>
                      <strong>{cs.storageSize}</strong>
                    </div>
                    <div>
                      <small>Prior Bill</small>
                      <strong>{cs.priorAnnualBill}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Interactive 7-Year Guarantee Estimator */}
      <section className="section section--alt">
        <div className="container">
          <div className="quote-banner">
            <div>
              <span className="eyebrow">04 — 84-Month Zero-Bill Guarantee</span>
              <h2 className="section-title">
                Calculate what seven years without an electricity bill saves you.
              </h2>
              <p className="lead-copy">
                Slide your current average monthly electricity spend. Teralio models 4.5% annual
                grid rate inflation—and replaces every statement for 7 years with $0.00.
              </p>
            </div>

            <div className="stack-md">
              <div className="range-field">
                <div className="form-label">
                  <span>Current Monthly Utility Bill</span>
                  <strong className="tabular form-label__strong">${monthlyBill} / mo</strong>
                </div>
                <input
                  type="range"
                  min="100"
                  max="650"
                  step="15"
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(Number(e.target.value))}
                  aria-label="Current Monthly Utility Bill"
                />
              </div>

              <div className="proposal-zero-box">
                <div>
                  <div className="proposal-zero-box__eyebrow">
                    84-Month Guaranteed Utility Savings
                  </div>
                  <div className="proposal-zero-box__big tabular">
                    ${sevenYearSavings.toLocaleString('en-US')}
                  </div>
                </div>
                <div className="proposal-zero-box__right">
                  <div className="proposal-zero-box__eyebrow">Your New Bill</div>
                  <div className="proposal-zero-box__sub">$0 / mo</div>
                </div>
              </div>

              <button
                type="button"
                className="btn-pill btn-pill--lg"
                onClick={() => navigate(`/quote?bill=${monthlyBill}`)}
              >
                <span>Configure My Roof &amp; Lock In $0</span>
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
