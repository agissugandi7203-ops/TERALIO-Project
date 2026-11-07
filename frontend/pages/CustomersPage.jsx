import React, { useState } from 'react';
import { isSupabaseConfigured } from '../supabaseClient.js';
import { Link } from '../context/RouterContext.jsx';
import { BRAND } from '../data/teralioData.js';
import { ArrowRightIcon } from '../components/Icons.jsx';

const INITIAL_LOADS = [
  { id: 'heatpump', name: 'Hydronic Heat Pump', kw: 2.8, on: true },
  { id: 'ev', name: 'Bidirectional EV Charger', kw: 7.4, on: false },
  { id: 'kitchen', name: 'Induction Kitchen & Hot Water', kw: 1.9, on: true },
  { id: 'snow', name: 'Roof Thermal Snow-Shed Pulse', kw: 1.4, on: false },
];

const STATEMENTS = [
  { month: 'October 2026', imported: '118 kWh', exported: '642 kWh', credit: '+$84.20', due: '$0.00' },
  { month: 'September 2026', imported: '64 kWh', exported: '890 kWh', credit: '+$126.50', due: '$0.00' },
  { month: 'August 2026', imported: '41 kWh', exported: '1,120 kWh', credit: '+$161.10', due: '$0.00' },
  { month: 'July 2026', imported: '38 kWh', exported: '1,205 kWh', credit: '+$174.80', due: '$0.00' },
];

export function CustomersPage() {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [loads, setLoads] = useState(INITIAL_LOADS);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSent, setLoginSent] = useState(false);

  const toggleLoad = (id) => {
    setLoads((prev) => prev.map((l) => (l.id === id ? { ...l, on: !l.on } : l)));
  };

  const baseLoad = 0.7;
  const totalLoadKw = baseLoad + loads.reduce((sum, item) => (item.on ? sum + item.kw : sum), 0);
  const solarHarvestKw = 8.6;
  const netFlowKw = solarHarvestKw - totalLoadKw;

  const handleMagicLink = (e) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    setLoginSent(true);
  };

  return (
    <main data-testid="customers-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">{BRAND.name} Homeowner Console</span>
          <h1 className="display-title">
            Live Smart Controller telemetry <em>&amp; $0 billing ledger.</em>
          </h1>
          <p className="lead-copy">
            Interact with a live sandbox of the {BRAND.name} Homeowner Console—or sign in with your
            installation ID to inspect real-time roof harvest, LFP Vault reserves, and monthly
            zero-balance statements.
          </p>

          <div className="chip-group chip-group--spaced">
            <button
              type="button"
              className={`filter-chip ${activeTab === 'telemetry' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              Interactive Live Demo Home
            </button>
            <button
              type="button"
              className={`filter-chip ${activeTab === 'signin' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('signin')}
            >
              Quick Magic-Link Sign In
            </button>
            <Link to="/login" className="filter-chip">
              Full Studio Login →
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {activeTab === 'telemetry' ? (
            <div className="stack-lg">
              <div className="grid-2">
                <div className="glass-card">
                  <div className="flex-between">
                    <span className="eyebrow eyebrow--flush">
                      Uppsala Demo Residence &bull; 18.4 kWp
                    </span>
                    <span className="status-live">Grid Connected (VPP Active)</span>
                  </div>

                  <div className="telemetry-grid">
                    <div className="telemetry-box">
                      <div className="telemetry-box__label">Roof Solar Output</div>
                      <div className="telemetry-box__val">{solarHarvestKw.toFixed(1)} kW</div>
                    </div>
                    <div className="telemetry-box">
                      <div className="telemetry-box__label">Active Home Load</div>
                      <div className="telemetry-box__val">{totalLoadKw.toFixed(1)} kW</div>
                    </div>
                    <div className="telemetry-box">
                      <div className="telemetry-box__label">Vault Flow</div>
                      <div className="telemetry-box__val telemetry-box__val--md telemetry-box__val--highlight">
                        {netFlowKw >= 0
                          ? `+${netFlowKw.toFixed(1)} kW Charging`
                          : `${netFlowKw.toFixed(1)} kW Discharging`}
                      </div>
                    </div>
                    <div className="telemetry-box">
                      <div className="telemetry-box__label">Guarantee Credit Bank</div>
                      <div className="telemetry-box__val">+$546.60</div>
                    </div>
                  </div>

                  <p className="card-body">
                    Toggle heavy appliances on the right to observe how Smart Controller balances
                    real-time roof generation with your 30.0 kWh LFP Vault—never exposing you to peak
                    utility demand charges.
                  </p>
                </div>

                <div className="glass-card">
                  <h2 className="card-heading">Smart Circuit Load Control</h2>
                  <p className="card-body">Test switching high-draw circuits on and off in real time:</p>

                  <div className="appliance-list">
                    {loads.map((item) => (
                      <div className="appliance-row" key={item.id}>
                        <div>
                          <div className="appliance-title">{item.name}</div>
                          <div className="appliance-sub tabular">{item.kw.toFixed(1)} kW draw</div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.on}
                          aria-label={`Toggle ${item.name}`}
                          className={`switch-pill ${item.on ? 'is-on' : ''}`}
                          onClick={() => toggleLoad(item.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-card">
                <div className="flex-between">
                  <div>
                    <h2 className="card-heading">Recent Guaranteed Utility Statements</h2>
                    <p className="card-body">
                      Month 38 of 84 under the {BRAND.name} 7-Year Zero-Bill Guarantee
                    </p>
                  </div>
                  <Link to="/quote" className="btn-pill">
                    <span>Configure Your Own $0 Roof</span>
                    <ArrowRightIcon />
                  </Link>
                </div>

                <div className="table-scroll">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Billing Period</th>
                        <th>Grid Import</th>
                        <th>Peak VPP Export</th>
                        <th>Reserve Credit</th>
                        <th className="align-right">Homeowner Bill</th>
                      </tr>
                    </thead>
                    <tbody className="tabular">
                      {STATEMENTS.map((row) => (
                        <tr key={row.month}>
                          <td className="text-strong">{row.month}</td>
                          <td className="text-muted">{row.imported}</td>
                          <td className="text-muted">{row.exported}</td>
                          <td className="text-accent">{row.credit}</td>
                          <td className="align-right text-strong">{row.due}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card glass-card--narrow">
              <span className="eyebrow eyebrow--flush">Passwordless Access</span>
              <h2 className="card-heading">Sign in to your {BRAND.name} Home</h2>
              <p className="card-body">
                Enter the email registered to your Smart Controller gateway to receive an encrypted
                one-click session link.
              </p>

              {loginSent ? (
                <div className="proposal-zero-box proposal-zero-box--stack">
                  <span className="proposal-zero-box__eyebrow">Link Dispatched</span>
                  <strong className="proposal-zero-box__sub">{loginEmail}</strong>
                  <span>Check your inbox for your instant Smart Controller session link.</span>
                </div>
              ) : (
                <form onSubmit={handleMagicLink}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="portal-email">
                      Homeowner Email
                    </label>
                    <input
                      id="portal-email"
                      type="email"
                      required
                      className="text-input"
                      placeholder="homeowner@teralio.energy"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-pill btn-pill--full">
                    Send One-Click Portal Link
                  </button>
                </form>
              )}

              <div className="portal-gateway-note">
                Cloud Auth Gateway: {isSupabaseConfigured() ? 'Supabase Connected' : 'Demo Sandbox Ready'}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default CustomersPage;
