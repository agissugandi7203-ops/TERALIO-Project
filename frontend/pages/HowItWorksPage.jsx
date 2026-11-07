import React, { useState } from 'react';
import { Link } from '../context/RouterContext.jsx';
import { WEATHER_SCENARIOS } from '../data/teralioData.js';
import { ArrowRightIcon } from '../components/Icons.jsx';

const SCENARIO_KEYS = ['summer', 'fog', 'winter', 'outage'];

const INSTALL_STEPS = [
  {
    day: 'Day 01',
    title: 'LiDAR Drone Photogrammetry',
    desc: 'Millimeter-accurate 3D roof pitch, rafter spacing, and horizon shade modeling in 25 minutes.',
  },
  {
    day: 'Day 04',
    title: 'Decking & Ice-Water Shield',
    desc: 'Old roofing stripped & recycled. High-temperature breathable waterproof membrane sealed deck-wide.',
  },
  {
    day: 'Day 08',
    title: 'Interlocking Charcoal Slate',
    desc: 'Active N-type solar slates and matching architectural perimeter tiles click into concealed wireways.',
  },
  {
    day: 'Day 11',
    title: 'Vault & Smart Controller',
    desc: 'Modular LFP storage and solid-state main panel gateway commissioned with <10 ms islanding.',
  },
  {
    day: 'Day 14',
    title: '$0 Bill Guarantee Live',
    desc: 'VPP wholesale market enrollment completes and your 84-month zero-electricity-bill clock begins.',
  },
];

export function HowItWorksPage() {
  const [scenarioKey, setScenarioKey] = useState('fog');
  const active = WEATHER_SCENARIOS[scenarioKey];

  return (
    <main data-testid="how-it-works-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">System Architecture</span>
          <h1 className="display-title">
            Engineered to outsmart weather, <em>seasons, and spot markets.</em>
          </h1>
          <p className="lead-copy">
            Conventional solar leaves you paying winter utility bills and cheap midday export rates.
            Teralio pairs full-surface solar slates with high-density LFP storage and an algorithmic
            Smart Controller that guarantees $0.00 bills for 7 years.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">01 — Interactive Stress Test</span>
              <h2 className="section-title">Test the Smart Controller against any season</h2>
            </div>
            <div className="chip-group" role="group" aria-label="Select weather scenario">
              {SCENARIO_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`filter-chip ${scenarioKey === key ? 'is-active' : ''}`}
                  onClick={() => setScenarioKey(key)}
                >
                  {WEATHER_SCENARIOS[key].name}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <div className="flex-between">
              <div>
                <span className="eyebrow eyebrow--compact">{active.tag}</span>
                <h3 className="card-heading card-heading--lg">{active.name}</h3>
              </div>
              <div className="proposal-zero-box">
                <span className="proposal-zero-box__eyebrow">Guaranteed Statement</span>
                <strong className="proposal-zero-box__sub">{active.guaranteedBill}</strong>
              </div>
            </div>

            <div className="grid-2">
              <div className="telemetry-box">
                <div className="telemetry-box__label">Daily Roof Harvest</div>
                <div className="telemetry-box__val">{active.solarDailyKwh} kWh</div>
              </div>
              <div className="telemetry-box">
                <div className="telemetry-box__label">Household + Heat Pump</div>
                <div className="telemetry-box__val">{active.consumptionKwh} kWh</div>
              </div>
              <div className="telemetry-box">
                <div className="telemetry-box__label">Vault Reserve Floor</div>
                <div className="telemetry-box__val">{active.batteryFloor}</div>
              </div>
              <div className="telemetry-box">
                <div className="telemetry-box__label">Arbitrage Settlement</div>
                <div className="telemetry-box__val telemetry-box__val--md telemetry-box__val--highlight">
                  {active.arbitrageCredit}
                </div>
              </div>
            </div>

            <p className="card-body card-body--lg">{active.controllerNote}</p>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">02 — Hardware &amp; Firmware Stack</span>
              <h2 className="section-title">Four layers working as a single organism</h2>
            </div>
          </div>

          <div className="grid-2">
            <article className="glass-card">
              <span className="card-index">Layer 01</span>
              <h3 className="card-heading">Low-Haze Tempered Solar Slate</h3>
              <p className="card-body">
                Micro-textured anti-reflective front glass traps oblique morning and overcast sky
                photons while appearing matte charcoal from street level. Integrated bypass diodes
                prevent chimney or tree shadows from dragging down adjacent courses.
              </p>
              <ul className="spec-list">
                <li>21.4 kg/m² — lighter than natural quarry slate or clay tile</li>
                <li>Concealed IP68 MC4-Evo2 busbars beneath weatherproof ridge flashing</li>
              </ul>
            </article>

            <article className="glass-card">
              <span className="card-index">Layer 02</span>
              <h3 className="card-heading">Ridge-Cooled SiC Micro-String Architecture</h3>
              <p className="card-body">
                Silicon-carbide power optimizers operate at 99.1% peak conversion efficiency,
                eliminating bulky exterior conduit runs and unsightly utility wall boxes.
              </p>
              <ul className="spec-list">
                <li>Rapid shutdown compliant to &lt; 30V within 200 milliseconds</li>
                <li>Passive convection cooling integrated into ridge ventilation</li>
              </ul>
            </article>

            <article className="glass-card">
              <span className="card-index">Layer 03</span>
              <h3 className="card-heading">Cobalt-Free LiFePO4 Energy Vault</h3>
              <p className="card-body">
                Prismatic LFP cells deliver uncompromising thermal safety and decade-long cycle
                endurance—allowing daily deep arbitrage cycling without premature degradation.
              </p>
              <ul className="spec-list">
                <li>11.5 kW continuous / 18.4 kW surge power per Vault stack</li>
                <li>NEMA 4X / IP66 indoor or outdoor architectural enclosure</li>
              </ul>
            </article>

            <article className="glass-card">
              <span className="card-index">Layer 04</span>
              <h3 className="card-heading">Wholesale VPP &amp; 7-Year Settlement Engine</h3>
              <p className="card-body">
                By pooling thousands of Teralio homes into a fast-frequency Virtual Power Plant, we
                earn grid stabilization &amp; peak-tariff revenue—funding 100% of your remaining
                electricity bills for seven guaranteed years.
              </p>
              <ul className="spec-list">
                <li>Direct utility auto-pay integration—you never see a balance due</li>
                <li>Zero homeowner exposure to spot-price spikes or negative rates</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">03 — Turnkey Execution</span>
              <h2 className="section-title">From LiDAR scan to $0 bills in 14 days</h2>
            </div>
            <Link to="/quote" className="btn-pill">
              <span>Start Your Roof Assessment</span>
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="timeline-grid">
            {INSTALL_STEPS.map((s) => (
              <div className="timeline-step" key={s.day}>
                <span className="timeline-day">{s.day}</span>
                <h3 className="card-heading card-heading--sm">{s.title}</h3>
                <p className="card-body">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default HowItWorksPage;
