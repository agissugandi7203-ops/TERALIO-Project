import React, { useState } from 'react';

const PERIOD_METRICS = {
  D: { value: '14 Kos', unit: '/Hari', filledDefault: 7 },
  W: { value: '42 Kos', unit: '/Minggu', filledDefault: 11 },
  M: { value: '96%', unit: '/Kecocokan', filledDefault: 13 },
};

const CRITERIA_LABELS = [
  'Lokasi Kampus',
  'Maksimal Budget',
  'Kamar Mandi Dalam',
  'Wi-Fi Cepat',
  'Suasana Tenang Nugas',
  'Kamar Berperabot (Furnished)',
  'Pendingin Ruangan (AC)',
  'Akses Bebas 24 Jam',
  'Dekat Laundry',
  'Parkir Luas',
  'Termasuk Listrik',
  'Dapur Bersama',
  'Pemilik Terverifikasi',
  'Keamanan CCTV',
  'Dekat Transportasi',
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
          <h3 className="status-bento-card__title">Status Preferensi</h3>
          <p className="status-bento-card__desc">
            Pantau kecocokan kriteria kos harian Anda. Filter cerdas untuk
            menemukan hunian paling ideal.
          </p>
          <span className="lime-well-done-pill">
            <span>Sangat Cocok</span>
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
