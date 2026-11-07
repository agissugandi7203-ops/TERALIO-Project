import React, { useState } from 'react';

const REVIEWER_AVATARS = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23334155'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23fde68a'/%3E%3Cpath d='M12 60c3-11 11-18 20-18s17 7 20 18' fill='%2394a3b8'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%230f766e'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23fed7aa'/%3E%3Cpath d='M12 60c3-11 11-18 20-18s17 7 20 18' fill='%232dd4bf'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%234338ca'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23fef08a'/%3E%3Cpath d='M12 60c3-11 11-18 20-18s17 7 20 18' fill='%23818cf8'/%3E%3C/svg%3E",
];

const CURATED_SPOTLIGHTS = [
  {
    title: 'Suasana Tenang & Nyaman di Kos Harmoni',
    badge: 'Fokus Belajar',
    copy: 'Kamar kedap suara berjarak 650m dari Telkom University. Kamar mandi dalam, Wi-Fi fiber 100 Mbps, dan meja belajar nyaman.',
    query: 'Kos Harmoni',
    campusId: 'telkom',
  },
  {
    title: 'Nikmati Kenyamanan Hunian Fokus & Tenang',
    badge: 'Fokus & Tenang',
    copy: 'Pilihan hunian mahasiswa terverifikasi untuk istirahat optimal bebas kebisingan. Berjarak hanya 8 menit jalan kaki ke kampus.',
    query: 'Pondok UTB',
    campusId: 'utb',
  },
  {
    title: 'Studio Furnished Modern di Sukapura Loft',
    badge: 'Furnished',
    copy: 'Siap huni mulai Rp1.350.000/bln dengan water heater, akses smart card, dan fasilitas dapur bersama bebas pakai.',
    query: 'Sukapura Loft',
    campusId: 'telkom',
  },
  {
    title: 'Hunian Sejuk Asri di Bojongsoang Suites',
    badge: 'Asri & Sejuk',
    copy: 'Kamar dengan sirkulasi udara alami dan pencahayaan matahari, shelter sepeda khusus, serta keamanan CCTV 24 jam.',
    query: 'Bojongsoang',
    campusId: 'telkom',
  },
  {
    title: 'Hunian Hemat & Terjangkau di Dayeuhkolot Hub',
    badge: 'Hemat Budget',
    copy: 'Paket all-in Rp1.150.000/bln sudah termasuk listrik, titik antar-jemput laundry, dan hanya 5 menit jalan kaki ke gerbang kampus.',
    query: 'Dayeuhkolot',
    campusId: 'telkom',
  },
];

export const CuratedKosCard = ({ onOpenKosInMap } = {}) => {
  const [index, setIndex] = useState(1); // Starts on 2/5 just like reference!
  const total = CURATED_SPOTLIGHTS.length;
  const current = CURATED_SPOTLIGHTS[index];

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % total);
  };

  return (
    <article className="white-bento-card" data-testid="curated-kos-card">
      <div>
        <div className="avatar-stack" aria-hidden="true">
          {REVIEWER_AVATARS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="avatar-stack__item"
              style={{ width: '34px', height: '34px' }}
            />
          ))}
        </div>

        <h3 className="curated-card__title">{current.title}</h3>

        <div
          className="curated-card__callout"
          style={{ cursor: onOpenKosInMap ? 'pointer' : 'default' }}
          onClick={() => onOpenKosInMap?.(current)}
          title={onOpenKosInMap ? 'Klik untuk langsung melihat di peta' : undefined}
        >
          <span className="curated-card__badge">
            <span>{current.badge}</span>
          </span>
          <p className="curated-card__copy">{current.copy}</p>
        </div>
      </div>

      <div className="curated-card__footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="curated-card__counter" data-testid="curated-counter">
            <strong>{index + 1}</strong>/{total}
          </div>
          {onOpenKosInMap && (
            <button
              type="button"
              className="curated-card__map-pill"
              onClick={() => onOpenKosInMap(current)}
              data-testid="curated-open-map-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#2563eb',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '999px',
                padding: '3px 8px',
                cursor: 'pointer',
              }}
              title="Lihat kos ini langsung di peta"
            >
              <span>Lihat di Peta</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>

        <div className="carousel-arrows">
          <button
            type="button"
            className="carousel-arrow-btn"
            onClick={handlePrev}
            aria-label="Previous recommendation"
            data-testid="curated-prev-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="carousel-arrow-btn"
            onClick={handleNext}
            aria-label="Next recommendation"
            data-testid="curated-next-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
};

export default CuratedKosCard;
