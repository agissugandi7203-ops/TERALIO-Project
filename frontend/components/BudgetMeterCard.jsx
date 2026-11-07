import React from 'react';

const TOTAL_TICKS = 22;
const ACTIVE_TICKS = 18;

export const BudgetMeterCard = () => {
  return (
    <article className="white-bento-card" data-testid="budget-meter-card">
      <div>
        <div className="metric-card__header">
          <div className="metric-card__title-group">
            <span className="metric-icon-chip" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.5c-2.5 3.2-6 6.8-6 11a6 6 0 0 0 12 0c0-4.2-3.5-7.8-6-11zm0 14.5a3 3 0 0 1-3-3c0-1.5 1.2-3.2 3-5.2 1.8 2 3 3.7 3 5.2a3 3 0 0 1-3 3z" />
              </svg>
            </span>
            <h3 className="metric-card__heading">Kos Budget</h3>
          </div>

          <div className="metric-card__cap">
            1.500 <small>K IDR</small>
          </div>
        </div>

        <div className="metric-card__subrow">
          <span>Optimal student living allocation</span>
          <span>Monthly cap</span>
        </div>

        <div className="budget-big-figure">
          1.250<span>/K IDR</span>
        </div>

        <div className="tick-meter-labels" aria-hidden="true">
          <span>0</span>
          <span>1.500</span>
        </div>

        <div
          className="tick-meter-bars"
          role="progressbar"
          aria-valuenow={1250}
          aria-valuemin={0}
          aria-valuemax={1500}
          aria-label="Monthly budget utilization"
        >
          {Array.from({ length: TOTAL_TICKS }).map((_, idx) => (
            <span
              key={idx}
              className={`tick-bar ${idx < ACTIVE_TICKS ? 'is-active' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="budget-breakdown-row">
        <div className="breakdown-item">
          <strong>
            950 <small>K</small>
          </strong>
          <span>Base Rent</span>
        </div>
        <div className="breakdown-item">
          <strong>
            180 <small>K</small>
          </strong>
          <span>Fiber Wi-Fi</span>
        </div>
        <div className="breakdown-item">
          <strong>
            120 <small>K</small>
          </strong>
          <span>Power &amp; Water</span>
        </div>
      </div>
    </article>
  );
};

export default BudgetMeterCard;
