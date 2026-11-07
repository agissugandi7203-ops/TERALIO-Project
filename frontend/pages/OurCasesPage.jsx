import React, { useState } from 'react';
import { CASE_STUDIES, MEDIA_ASSETS } from '../data/teralioData.js';
import { Link } from '../context/RouterContext.jsx';
import { CloseIcon, ArrowRightIcon } from '../components/Icons.jsx';

const CLIMATES = ['All', 'Nordic / Snow', 'Coastal Fog', 'Continental'];

export function OurCasesPage() {
  const [selectedClimate, setSelectedClimate] = useState('All');
  const [activeCase, setActiveCase] = useState(null);
  const { hero } = MEDIA_ASSETS;

  const filteredCases =
    selectedClimate === 'All'
      ? CASE_STUDIES
      : CASE_STUDIES.filter((c) => c.climate === selectedClimate);

  return (
    <main data-testid="our-cases-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Verified Installations</span>
          <h1 className="display-title">
            Architectural roofs paying <em>$0.00 in every latitude.</em>
          </h1>
          <p className="lead-copy">
            Inspect real homeowner telemetry, system sizing, and multi-year utility ledgers across
            heavy-snow alpine valleys, misty coastlines, and rural farmsteads.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="filter-bar">
            <div className="chip-group" role="group" aria-label="Filter cases by climate">
              {CLIMATES.map((climate) => (
                <button
                  key={climate}
                  type="button"
                  className={`filter-chip ${selectedClimate === climate ? 'is-active' : ''}`}
                  onClick={() => setSelectedClimate(climate)}
                >
                  {climate}
                </button>
              ))}
            </div>
            <span className="muted-count">
              Showing <strong>{filteredCases.length}</strong> audited installations
            </span>
          </div>

          <div className="grid-3">
            {filteredCases.map((cs, idx) => (
              <article
                className="case-card glass-card--interactive"
                key={cs.id}
                onClick={() => setActiveCase(cs)}
              >
                <div className="case-card__media">
                  <img
                    src={idx % 2 === 0 ? hero.groundNight : hero.groundMorning}
                    alt={cs.title}
                  />
                  <span className="case-card__badge">{cs.climate}</span>
                  <span className="case-card__zero">{cs.monthsAtZero} Months at $0</span>
                </div>

                <div className="case-card__content">
                  <div>
                    <div className="case-card__meta">
                      {cs.location} &bull; {cs.roofArea} Roof
                    </div>
                    <h2 className="card-heading">{cs.title}</h2>
                  </div>

                  <p className="card-body">“{cs.quote}”</p>

                  <div className="case-metrics-row">
                    <div>
                      <small>Solar Slate</small>
                      <strong>{cs.systemSize}</strong>
                    </div>
                    <div>
                      <small>LFP Vault</small>
                      <strong>{cs.storageSize}</strong>
                    </div>
                    <div>
                      <small>Saved / Yr</small>
                      <strong>{cs.priorAnnualBill}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {activeCase && (
        <div
          className="modal-backdrop"
          onClick={() => setActiveCase(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeCase.title}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow eyebrow--compact">
                  {activeCase.climate} &bull; {activeCase.location}
                </span>
                <h2 className="card-heading card-heading--lg">{activeCase.title}</h2>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActiveCase(null)}
                aria-label="Close case details"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="proposal-zero-box">
              <div>
                <div className="proposal-zero-box__eyebrow">Verified Consecutive $0 Streak</div>
                <div className="proposal-zero-box__sub">
                  {activeCase.monthsAtZero} Months &bull; $0.00 Paid
                </div>
              </div>
              <div className="proposal-zero-box__right">
                <div className="proposal-zero-box__eyebrow">Prior Utility Spend</div>
                <div className="proposal-zero-box__sub">{activeCase.priorAnnualBill}</div>
              </div>
            </div>

            <div className="telemetry-grid">
              <div className="telemetry-box">
                <div className="telemetry-box__label">Roof Footprint</div>
                <div className="telemetry-box__val">{activeCase.roofArea}</div>
              </div>
              <div className="telemetry-box">
                <div className="telemetry-box__label">Active Solar Array</div>
                <div className="telemetry-box__val">{activeCase.systemSize}</div>
              </div>
              <div className="telemetry-box">
                <div className="telemetry-box__label">LFP Storage Vault</div>
                <div className="telemetry-box__val">{activeCase.storageSize}</div>
              </div>
              <div className="telemetry-box">
                <div className="telemetry-box__label">Carbon Displaced</div>
                <div className="telemetry-box__val">{activeCase.co2Offset}</div>
              </div>
            </div>

            <ul className="spec-list">
              {activeCase.specs.map((sp) => (
                <li key={sp}>{sp}</li>
              ))}
            </ul>

            <blockquote className="case-quote-callout">
              “{activeCase.quote}” — <strong>{activeCase.homeowner}</strong>
            </blockquote>

            <div className="flex-end-actions">
              <button
                type="button"
                className="btn-pill btn-pill--ghost"
                onClick={() => setActiveCase(null)}
              >
                Close
              </button>
              <Link to="/quote" className="btn-pill">
                <span>Configure Similar Roof</span>
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default OurCasesPage;
