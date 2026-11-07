import React from 'react';

export function PageHero({ eyebrow, titlePrimary, titleMuted, titleAccent, description, actions }) {
  return (
    <section className="page-hero">
      <div className="page-hero-glow" aria-hidden="true" />
      <div className="section-shell page-hero-inner">
        {eyebrow ? <span className="eyebrow-pill">{eyebrow}</span> : null}
        <h1 className="page-hero-title">
          <span>{titlePrimary}</span>
          {(titleMuted || titleAccent) && (
            <span>
              {titleMuted ? <i className="split-muted">{titleMuted} </i> : null}
              {titleAccent ? <span>{titleAccent}</span> : null}
            </span>
          )}
        </h1>
        {description ? <p className="page-hero-lead">{description}</p> : null}
        {actions ? <div className="page-hero-actions">{actions}</div> : null}
      </div>
    </section>
  );
}

export default PageHero;
