import React, { useState, useMemo } from 'react';
import { useRouter } from '../context/RouterContext.jsx';
import { BRAND } from '../data/teralioData.js';
import { ArrowRightIcon, ArrowLeftIcon } from '../components/Icons.jsx';

const ROOF_STYLES = [
  { id: 'gable', name: 'Charcoal Gable Farmhouse', factor: 1.0, desc: 'Classic steep dual-pitch roof' },
  { id: 'nordic', name: 'Nordic Standing Pitch', factor: 1.04, desc: 'Clean uninterrupted solar plane' },
  { id: 'hip', name: 'Multi-Plane Hip Roof', factor: 0.94, desc: 'East/South/West multi-azimuth harvest' },
  { id: 'shed', name: 'Modern Architectural Shed', factor: 1.06, desc: 'Optimal angle mono-slope array' },
];

const CLIMATE_ZONES = [
  { id: 'fog', name: 'Coastal / Frequent Fog', vaultBoost: 1 },
  { id: 'snow', name: 'Nordic / Heavy Snow', vaultBoost: 1 },
  { id: 'continental', name: 'Four-Season Continental', vaultBoost: 0 },
  { id: 'sunny', name: 'High-Irradiance / Peak Tariff', vaultBoost: 0 },
];

export function QuotePage() {
  const { searchParams } = useRouter();
  const initialBill = useMemo(() => {
    const raw = Number(searchParams.get('bill'));
    if (Number.isFinite(raw) && raw >= 80 && raw <= 900) return raw;
    return 265;
  }, [searchParams]);

  const [step, setStep] = useState(1);
  const [roofStyle, setRoofStyle] = useState('gable');
  const [climate, setClimate] = useState('fog');
  const [roofArea, setRoofArea] = useState(210);
  const [monthlyBill, setMonthlyBill] = useState(initialBill);
  const [evCount, setEvCount] = useState(1);
  const [hasHeatPump, setHasHeatPump] = useState(true);
  const [contact, setContact] = useState({ name: '', email: '', address: '' });
  const [quoteId, setQuoteId] = useState(null);

  const selectedStyleObj = ROOF_STYLES.find((r) => r.id === roofStyle) || ROOF_STYLES[0];
  const selectedClimateObj = CLIMATE_ZONES.find((c) => c.id === climate) || CLIMATE_ZONES[0];

  const recommendedKwp = Number(
    Math.max(9.6, Math.min(32.0, roofArea * 0.086 * selectedStyleObj.factor)).toFixed(1)
  );
  const baseVaultModules =
    monthlyBill > 340 || evCount >= 2 ? 3 : monthlyBill > 190 || hasHeatPump ? 2 : 1;
  const totalVaultModules = Math.min(4, baseVaultModules + selectedClimateObj.vaultBoost);
  const vaultKwh = (totalVaultModules * 14.4).toFixed(1);
  const sevenYearUtilitySavings = Math.round(monthlyBill * 12 * 7.95 + evCount * 4200);

  const handleLockQuote = (e) => {
    e.preventDefault();
    if (!contact.name.trim() || !contact.email.trim()) return;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    setQuoteId(`TR-2026-${randomCode}`);
  };

  return (
    <main data-testid="quote-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Instant Architectural Quote</span>
          <h1 className="display-title">
            Size your {BRAND.name} Roof &amp; <em>7-Year $0 Guarantee.</em>
          </h1>
          <p className="lead-copy">
            Configure your roof geometry, climate zone, and electrification profile in under a
            minute. No sales calls required to view engineering specs.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="configurator-grid">
            <div className="glass-card">
              <div className="step-pills" role="tablist" aria-label="Quote steps">
                <button
                  type="button"
                  className={`step-pill ${step === 1 ? 'is-active' : ''}`}
                  onClick={() => setStep(1)}
                >
                  01. Roof &amp; Climate
                </button>
                <button
                  type="button"
                  className={`step-pill ${step === 2 ? 'is-active' : ''}`}
                  onClick={() => setStep(2)}
                >
                  02. Energy &amp; EVs
                </button>
                <button
                  type="button"
                  className={`step-pill ${step === 3 ? 'is-active' : ''}`}
                  onClick={() => setStep(3)}
                >
                  03. Lock $0 Proposal
                </button>
              </div>

              {step === 1 && (
                <div className="stack-md">
                  <div>
                    <div className="form-label">
                      <span>Select Roof Architecture</span>
                    </div>
                    <div className="option-cards">
                      {ROOF_STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          className={`option-card ${roofStyle === style.id ? 'is-selected' : ''}`}
                          onClick={() => setRoofStyle(style.id)}
                        >
                          <strong>{style.name}</strong>
                          <small>{style.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="range-field">
                    <div className="form-label">
                      <span>Estimated Roof Footprint</span>
                      <strong className="tabular">
                        {roofArea} m² ({Math.round(roofArea * 10.76)} sq ft)
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="90"
                      max="360"
                      step="10"
                      value={roofArea}
                      onChange={(e) => setRoofArea(Number(e.target.value))}
                      aria-label="Estimated Roof Footprint"
                    />
                  </div>

                  <div>
                    <div className="form-label">
                      <span>Primary Climate Profile</span>
                    </div>
                    <div className="option-cards">
                      {CLIMATE_ZONES.map((zone) => (
                        <button
                          key={zone.id}
                          type="button"
                          className={`option-card ${climate === zone.id ? 'is-selected' : ''}`}
                          onClick={() => setClimate(zone.id)}
                        >
                          <strong>{zone.name}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-end-actions">
                    <button type="button" className="btn-pill btn-pill--lg" onClick={() => setStep(2)}>
                      <span>Continue to Energy Profile</span>
                      <ArrowRightIcon />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="stack-md">
                  <div className="range-field">
                    <div className="form-label">
                      <span>Average Monthly Electricity Bill</span>
                      <strong className="tabular">${monthlyBill} / month</strong>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="650"
                      step="15"
                      value={monthlyBill}
                      onChange={(e) => setMonthlyBill(Number(e.target.value))}
                      aria-label="Average Monthly Electricity Bill"
                    />
                  </div>

                  <div>
                    <div className="form-label">
                      <span>Electric Vehicles Charged at Home</span>
                    </div>
                    <div className="chip-group">
                      {[0, 1, 2].map((count) => (
                        <button
                          key={count}
                          type="button"
                          className={`filter-chip ${evCount === count ? 'is-active' : ''}`}
                          onClick={() => setEvCount(count)}
                        >
                          {count === 0
                            ? 'No EV Yet'
                            : count === 1
                            ? '1 Electric Vehicle'
                            : '2+ Electric Vehicles'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="appliance-row">
                    <div>
                      <div className="appliance-title">Electric Heat Pump / Hydronic Heating</div>
                      <div className="appliance-sub">
                        Sizes winter LFP Vault buffer for sub-zero thermal loads
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hasHeatPump}
                      aria-label="Toggle heat pump"
                      className={`switch-pill ${hasHeatPump ? 'is-on' : ''}`}
                      onClick={() => setHasHeatPump((v) => !v)}
                    />
                  </div>

                  <div className="flex-between">
                    <button
                      type="button"
                      className="btn-pill btn-pill--ghost"
                      onClick={() => setStep(1)}
                    >
                      <ArrowLeftIcon />
                      <span>Back</span>
                    </button>
                    <button type="button" className="btn-pill btn-pill--lg" onClick={() => setStep(3)}>
                      <span>Review &amp; Reserve Guarantee</span>
                      <ArrowRightIcon />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  {quoteId ? (
                    <div className="stack-md">
                      <div className="proposal-zero-box proposal-zero-box--stack">
                        <span className="proposal-zero-box__eyebrow">
                          Proposal Reserved &bull; Ref #{quoteId}
                        </span>
                        <strong className="proposal-zero-box__sub">
                          Your 7-Year $0 Bill Blueprint is Ready
                        </strong>
                      </div>
                      <p className="card-body">
                        We have queued satellite LiDAR modeling for{' '}
                        <strong>{contact.address || 'your property'}</strong> and dispatched the
                        engineering specification dossier to <strong>{contact.email}</strong>.
                      </p>
                      <button
                        type="button"
                        className="btn-pill btn-pill--ghost btn-pill--self-start"
                        onClick={() => setQuoteId(null)}
                      >
                        Modify Configuration
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleLockQuote}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="quote-name">
                          Homeowner Full Name *
                        </label>
                        <input
                          id="quote-name"
                          type="text"
                          required
                          className="text-input"
                          placeholder="Alex Lindstrom"
                          value={contact.name}
                          onChange={(e) => setContact({ ...contact, name: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="quote-email">
                          Email for Engineering Dossier *
                        </label>
                        <input
                          id="quote-email"
                          type="email"
                          required
                          className="text-input"
                          placeholder="alex@domain.com"
                          value={contact.email}
                          onChange={(e) => setContact({ ...contact, email: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="quote-address">
                          Property Street &amp; Postal Code
                        </label>
                        <input
                          id="quote-address"
                          type="text"
                          className="text-input"
                          placeholder="42 Ridgeview Lane, 05401"
                          value={contact.address}
                          onChange={(e) => setContact({ ...contact, address: e.target.value })}
                        />
                      </div>

                      <div className="flex-between">
                        <button
                          type="button"
                          className="btn-pill btn-pill--ghost"
                          onClick={() => setStep(2)}
                        >
                          <ArrowLeftIcon />
                          <span>Back</span>
                        </button>
                        <button type="submit" className="btn-pill btn-pill--lg">
                          <span>Generate Guaranteed $0 Quote</span>
                          <ArrowRightIcon />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            <aside className="proposal-summary">
              <div>
                <span className="eyebrow eyebrow--compact">Live System Sizing</span>
                <h2 className="card-heading">Engineered {BRAND.name} Specification</h2>
              </div>

              <div className="proposal-zero-box">
                <div>
                  <div className="proposal-zero-box__eyebrow">Years 1–7 Electricity Bill</div>
                  <div className="proposal-zero-box__big">$0.00 / mo</div>
                </div>
                <div className="proposal-zero-box__right">
                  <div className="proposal-zero-box__eyebrow">84-Mo Savings</div>
                  <div className="proposal-zero-box__sub tabular">
                    ${sevenYearUtilitySavings.toLocaleString('en-US')}
                  </div>
                </div>
              </div>

              <div>
                <div className="proposal-row">
                  <span>Charcoal N-Type Solar Slate</span>
                  <strong>{recommendedKwp} kWp</strong>
                </div>
                <div className="proposal-row">
                  <span>{BRAND.name} LFP Energy Vault</span>
                  <strong>
                    {vaultKwh} kWh ({totalVaultModules}x Vault)
                  </strong>
                </div>
                <div className="proposal-row">
                  <span>Smart Controller Gateway</span>
                  <strong>200A Whole-Home (&lt;10 ms)</strong>
                </div>
                <div className="proposal-row">
                  <span>EV &amp; Heat Pump Coverage</span>
                  <strong>
                    {evCount} EV + {hasHeatPump ? 'Heat Pump' : 'Standard'}
                  </strong>
                </div>
                <div className="proposal-row">
                  <span>Structural &amp; Weather Warranty</span>
                  <strong>25 Years Full Roof</strong>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

export default QuotePage;
