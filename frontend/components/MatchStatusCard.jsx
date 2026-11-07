import React, { useState } from 'react';

const PERIOD_METRICS = {
  D: { value: '14 Kos', unit: '/Day', filledDefault: 7 },
  W: { value: '42 Kos', unit: '/Week', filledDefault: 11 },
  M: { value: '96%', unit: '/Match', filledDefault: 13 },
};

const CRITERIA_LABELS = [
  'Campus Location',
  'Max Budget',
  'Private Bathroom',
  'High-Speed Wi-Fi',
  'Quiet Study Env',
  'Furnished Room',
  'Air Conditioning',
  '24/7 Access',
  'Laundry Nearby',
  'Parking Space',
  'Power Included',
  'Shared Kitchen',
  'Verified Host',
  'CCTV Security',
  'Transit Proximity',
];

export const MatchStatusCard = () => {
  const [period, setPeriod] = useState('D');
  const [filledCount, setFilledCount] = useState(7);

  const handlePeriodChange = (key) => {
    setPeriod(key);
    setFilledCount(PERIOD_METRICS[key].filledDefault);
  };

  const currentMetric = PERIOD_METRICS[period];

  return (
    <section className="status-bento-card" data-testid="match-status-card">
      <div className="status-bento-card__top">
        <div>
          <h3 className="status-bento-card__title">Preference Status</h3>
          <p className="status-bento-card__desc">
            Drive your ideal kos criteria daily. Build smart filters and achieve
            your best match.
          </p>
          <span className="lime-well-done-pill">
            <span>Well Matched</span>
            <span aria-hidden="true">👍</span>
          </span>
        </div>

        <div
          className="slots-matrix"
          role="group"
          aria-label="Preference completion slots"
        >
          {CRITERIA_LABELS.map((label, idx) => {
            const isFilled = idx < filledCount;
            return (
              <button
                key={label}
                type="button"
                className={`slot-vessel ${isFilled ? 'is-filled' : ''}`}
                onClick={() => setFilledCount(idx + 1)}
                title={`${label}: ${isFilled ? 'Active' : 'Click to include'}`}
                aria-label={`${label} (${isFilled ? 'active' : 'inactive'})`}
              />
            );
          })}
        </div>
      </div>

      <div className="status-bento-card__bottom">
        <div className="period-tabs" role="tablist" aria-label="Timeframe">
          {['D', 'W', 'M'].map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={period === key}
              className={`period-tab ${period === key ? 'is-active' : ''}`}
              onClick={() => handlePeriodChange(key)}
              data-testid={`period-tab-${key}`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="status-bento-card__metric">
          <span className="status-bento-card__value">
            {period === 'D' ? `${(filledCount * 0.31).toFixed(2)}km` : currentMetric.value}
          </span>
          <span className="status-bento-card__unit">
            {period === 'D' ? '/Radius' : currentMetric.unit}
          </span>
        </div>
      </div>
    </section>
  );
};

export default MatchStatusCard;
