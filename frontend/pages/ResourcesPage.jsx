import React, { useState, useEffect } from 'react';
import { RESOURCES_LIST, FAQ_ITEMS } from '../data/teralioData.js';
import { Link, useRouter } from '../context/RouterContext.jsx';
import { CloseIcon, ArrowRightIcon, PlusMinusIcon } from '../components/Icons.jsx';

const CATEGORIES = [
  'All',
  'Technical Whitepapers',
  'Homeowner Guides',
  'Grid Market Reports',
  'Warranty & Legal',
];

export function ResourcesPage() {
  const { searchParams } = useRouter();
  const [category, setCategory] = useState('All');
  const [openFaq, setOpenFaq] = useState(0);
  const [activeDoc, setActiveDoc] = useState(null);

  useEffect(() => {
    const docParam = searchParams.get('doc');
    if (docParam) {
      const matched = RESOURCES_LIST.find((r) => r.id === docParam);
      if (matched) setActiveDoc(matched);
    }
  }, [searchParams]);

  const visibleResources =
    category === 'All'
      ? RESOURCES_LIST
      : RESOURCES_LIST.filter((r) => r.category === category);

  return (
    <main data-testid="resources-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Technical Library &amp; FAQ</span>
          <h1 className="display-title">
            Transparent engineering, <em>plain-language guarantees.</em>
          </h1>
          <p className="lead-copy">
            Explore architect CAD specifications, sub-zero field yield studies, LiFePO4 safety
            testing, and the exact contract terms behind seven years of $0 electricity bills.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="filter-bar">
            <div className="chip-group" role="group" aria-label="Filter resources">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`filter-chip ${category === cat ? 'is-active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-3">
            {visibleResources.map((doc) => (
              <article
                className="glass-card glass-card--interactive"
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
              >
                <div className="flex-between">
                  <span className="card-index">{doc.category}</span>
                  <span className="muted-count">{doc.readTime}</span>
                </div>
                <h2 className="card-heading">{doc.title}</h2>
                <p className="card-body">{doc.excerpt}</p>
                <div className="card-footer-meta">
                  <span className="muted-count">{doc.metrics}</span>
                  <strong className="flex-row-wrap">
                    <span>Read Brief</span>
                    <ArrowRightIcon />
                  </strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container container--narrow">
          <div className="section-head">
            <div>
              <span className="eyebrow">Frequently Asked Questions</span>
              <h2 className="section-title">Everything about the 7-Year $0 Bill Guarantee</h2>
            </div>
          </div>

          <div className="faq-list">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div className="faq-item" key={item.q}>
                  <button
                    type="button"
                    className="faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  >
                    <span>{item.q}</span>
                    <span className="faq-icon">
                      <PlusMinusIcon expanded={isOpen} />
                    </span>
                  </button>
                  {isOpen && <div className="faq-answer">{item.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {activeDoc && (
        <div
          className="modal-backdrop"
          onClick={() => setActiveDoc(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeDoc.title}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow eyebrow--compact">
                  {activeDoc.category} &bull; {activeDoc.date}
                </span>
                <h2 className="card-heading card-heading--lg">{activeDoc.title}</h2>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setActiveDoc(null)}
                aria-label="Close document preview"
              >
                <CloseIcon />
              </button>
            </div>

            <p className="card-body card-body--lg">{activeDoc.excerpt}</p>

            <div className="telemetry-box">
              <div className="telemetry-box__label">Key Findings &amp; Specification Scope</div>
              <p className="card-body">
                Verified across {activeDoc.metrics}. Full architectural CAD drawings, inverter
                efficiency curves, and actuarial reserve schedules are included automatically in
                every custom homeowner proposal.
              </p>
            </div>

            <div className="flex-end-actions">
              <button
                type="button"
                className="btn-pill btn-pill--ghost"
                onClick={() => setActiveDoc(null)}
              >
                Close
              </button>
              <Link to="/quote" className="btn-pill">
                <span>Request Site-Specific Engineering Pack</span>
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ResourcesPage;
