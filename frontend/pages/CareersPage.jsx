import React, { useState } from 'react';
import { BRAND, OPEN_ROLES } from '../data/teralioData.js';
import { CloseIcon, ArrowRightIcon } from '../components/Icons.jsx';

const DEPARTMENTS = [
  'All',
  'Hardware & Power',
  'Grid AI & Firmware',
  'Architectural Roofing',
  'Operations',
];

export function CareersPage() {
  const [dept, setDept] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [applicant, setApplicant] = useState({ name: '', email: '', link: '', note: '' });
  const [submittedRole, setSubmittedRole] = useState(null);

  const filteredRoles = OPEN_ROLES.filter((role) => {
    const matchDept = dept === 'All' || role.department === dept;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      role.title.toLowerCase().includes(q) ||
      role.location.toLowerCase().includes(q) ||
      role.summary.toLowerCase().includes(q);
    return matchDept && matchQuery;
  });

  const handleApply = (e) => {
    e.preventDefault();
    if (!applicant.name.trim() || !applicant.email.trim()) return;
    setSubmittedRole(selectedRole.title);
    setApplicant({ name: '', email: '', link: '', note: '' });
  };

  return (
    <main data-testid="careers-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Careers at {BRAND.name}</span>
          <h1 className="display-title">
            Build the roof that <em>retires the electricity bill.</em>
          </h1>
          <p className="lead-copy">
            We combine structural building materials, high-voltage silicon-carbide electronics, and
            autonomous energy trading under one roof. Join us in Stockholm, Zurich, or Austin.
          </p>
        </div>
      </section>

      <section className="section--ledger">
        <div className="container">
          <div className="proof-ledger">
            <div className="proof-ledger__cell">
              <div className="proof-ledger__value">142 MW</div>
              <div className="proof-ledger__label">Live Fleet Dispatch</div>
              <p className="proof-ledger__detail">
                Production code and SiC hardware operating across live ISO markets
              </p>
            </div>
            <div className="proof-ledger__cell">
              <div className="proof-ledger__value">100%</div>
              <div className="proof-ledger__label">Transparent Equity</div>
              <p className="proof-ledger__detail">
                Published salary bands and meaningful employee ownership grants
              </p>
            </div>
            <div className="proof-ledger__cell">
              <div className="proof-ledger__value">3 Hubs</div>
              <div className="proof-ledger__label">Stockholm &bull; Zurich &bull; Austin</div>
              <p className="proof-ledger__detail">
                Direct hardware lab access with flexible cross-hub engineering sprints
              </p>
            </div>
            <div className="proof-ledger__cell">
              <div className="proof-ledger__value">$0 / mo</div>
              <div className="proof-ledger__label">Home Energy Stipend</div>
              <p className="proof-ledger__detail">
                Clean electricity stipend or at-cost {BRAND.name} roof installation
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="filter-bar">
            <div className="chip-group" role="group" aria-label="Filter roles by department">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`filter-chip ${dept === d ? 'is-active' : ''}`}
                  onClick={() => setDept(d)}
                >
                  {d}
                </button>
              ))}
            </div>

            <input
              type="search"
              className="search-input"
              placeholder="Search role or city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search open roles"
            />
          </div>

          <div className="role-list">
            {filteredRoles.map((role) => (
              <article className="role-row" key={role.id}>
                <div className="role-info">
                  <div className="role-meta">
                    {role.department} &bull; {role.location} &bull; {role.comp}
                  </div>
                  <h2 className="card-heading">{role.title}</h2>
                  <p className="card-body">{role.summary}</p>
                </div>

                <button
                  type="button"
                  className="btn-pill"
                  onClick={() => {
                    setSubmittedRole(null);
                    setSelectedRole(role);
                  }}
                >
                  <span>View &amp; Apply</span>
                  <ArrowRightIcon />
                </button>
              </article>
            ))}

            {filteredRoles.length === 0 && (
              <div className="glass-card glass-card--centered">
                <h3 className="card-heading">No matching roles found</h3>
                <p className="card-body">Try clearing your search filter or switching departments.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedRole && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedRole(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Apply for ${selectedRole.title}`}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="role-meta">
                  {selectedRole.department} &bull; {selectedRole.location}
                </div>
                <h2 className="card-heading card-heading--lg">{selectedRole.title}</h2>
                <div className="appliance-sub">Compensation: {selectedRole.comp}</div>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedRole(null)}
                aria-label="Close application modal"
              >
                <CloseIcon />
              </button>
            </div>

            <p className="card-body">{selectedRole.summary}</p>

            <ul className="spec-list">
              {selectedRole.requirements.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>

            {submittedRole ? (
              <div className="proposal-zero-box proposal-zero-box--stack">
                <span className="proposal-zero-box__eyebrow">Application Logged</span>
                <strong className="proposal-zero-box__sub">{submittedRole}</strong>
                <p>
                  Our engineering lead reviews every submission directly within 5 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="modal-divider-form">
                <div className="grid-2 grid-2--tight">
                  <div className="form-group">
                    <label className="form-label" htmlFor="app-name">
                      Full Name *
                    </label>
                    <input
                      id="app-name"
                      type="text"
                      required
                      className="text-input"
                      placeholder="Freja Lindberg"
                      value={applicant.name}
                      onChange={(e) => setApplicant({ ...applicant, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="app-email">
                      Email *
                    </label>
                    <input
                      id="app-email"
                      type="email"
                      required
                      className="text-input"
                      placeholder="freja@domain.com"
                      value={applicant.email}
                      onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="app-link">
                    GitHub / LinkedIn / Portfolio
                  </label>
                  <input
                    id="app-link"
                    type="text"
                    className="text-input"
                    placeholder="https://github.com/..."
                    value={applicant.link}
                    onChange={(e) => setApplicant({ ...applicant, link: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="app-note">
                    What technical problem have you loved solving?
                  </label>
                  <textarea
                    id="app-note"
                    rows={3}
                    className="textarea-input"
                    placeholder="Brief note to the engineering team..."
                    value={applicant.note}
                    onChange={(e) => setApplicant({ ...applicant, note: e.target.value })}
                  />
                </div>

                <div className="flex-end-actions">
                  <button
                    type="button"
                    className="btn-pill btn-pill--ghost"
                    onClick={() => setSelectedRole(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-pill">
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default CareersPage;
