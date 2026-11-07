import React from 'react';
import '../styles/caseResults.css';

const HEADLINE_WORDS = ['Studi', 'Kasus', 'Pencarian', 'Hunian', 'Mahasiswa', 'di', 'Teralio'];

const CASE_CARDS = [
  {
    id: 'telkom-sukapura',
    name: 'Mahasiswa Telkom University',
    outcome: 'Survei 9 Hari Jadi 15 Menit',
    monogram: 'house',
    stat1: { value: '-85%', label: 'waktu survei berkurang' },
    stat2: { value: '100%', label: 'bebas biaya tersembunyi' },
    bg: 'radial-gradient(circle at 35% 25%, rgb(176, 64, 18) 0%, rgb(46, 13, 4) 100%)',
    image: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/c42a7f3d-d802-4377-8cc6-9c209cdfad5f.webp',
    alt: 'Mahasiswa Telkom University menemukan kos dekat gerbang Sukapura',
  },
  {
    id: 'itb-dago',
    name: 'Mahasiswa ITB Ganesha',
    outcome: 'Budget Bulanan Terkendali',
    monogram: 'mountain',
    stat1: { value: 'Rp350 Rb', label: 'rata-rata hemat bulanan' },
    stat2: { value: '780m', label: 'jarak jalan kaki riil' },
    bg: 'linear-gradient(145deg, rgb(236, 96, 28) 0%, rgb(250, 150, 56) 100%)',
    image: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/d469e4d7-94ba-4457-ad51-b589766069f0.webp',
    alt: 'Mahasiswa ITB menemukan hunian nyaman di Cisitu Dago',
  },
  {
    id: 'juragan-sukabirus',
    name: 'Pemilik Kos Sukabirus & PGA',
    outcome: 'Penyewa Tepat Tanpa Makelar',
    monogram: 'lotus',
    stat1: { value: '0%', label: 'potongan komisi perantara' },
    stat2: { value: '3x', label: 'kunjungan survei lebih cepat' },
    bg: 'radial-gradient(circle at 35% 25%, rgb(132, 52, 22) 0%, rgb(24, 9, 5) 100%)',
    image: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e791074d-795e-4b42-ad94-a6b113ecb72d.webp',
    alt: 'Pemilik kos di kawasan Telkom University terhubung langsung dengan mahasiswa',
  },
];

const renderMonogram = (type) => {
  switch (type) {
    case 'mountain':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 3l4 8 5-5 5 10H2L8 3z" />
        </svg>
      );
    case 'house':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-6v6H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
        </svg>
      );
    case 'lotus':
    default:
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3c1.5 3 4 5 7 6-2 3-5 5-7 9-2-4-5-6-7-9 3-1 5.5-3 7-6z" />
          <path d="M12 12c.8 1.8 2.2 3 4 3.5-1.2 1.8-2.8 2.5-4 4.5-1.2-2-2.8-2.7-4-4.5 1.8-.5 3.2-1.7 4-3.5z" />
        </svg>
      );
  }
};

export function CaseResultsSection() {
  return (
    <div className="elo-results-section">
      {/* Centered High-End Header */}
      <header className="elo-header-wrap">
        <h2 className="elo-headline" aria-label="Studi Kasus Pencarian Hunian Mahasiswa di Teralio">
          {HEADLINE_WORDS.map((word, idx) => (
            <span
              key={`${word}-${idx}`}
              className="elo-word-span"
              style={{ '--w-idx': idx }}
            >
              {word}
            </span>
          ))}
        </h2>

        <p className="elo-lead">
          Dari 50 mahasiswa yang disurvei di sekitar kampus Telkom University dan ITB,
          74% menemukan biaya tambahan tak terduga saat mencari kos manual.
          Teralio membuktikan pencarian cerdas dengan kepastian biaya sewa dan rute riil ke kampus.
        </p>
      </header>

      {/* 3 Sunset Orange Result Cards Grid */}
      <div className="elo-cards-grid">
        {CASE_CARDS.map((card, idx) => (
          <article
            key={card.id}
            className="elo-card"
            style={{
              background: card.bg,
              '--c-idx': idx,
            }}
          >
            {/* Top row: Client Name, Outcome & Line Monogram */}
            <div className="elo-card-header">
              <div>
                <h3 className="elo-client-name">{card.name}</h3>
                <p className="elo-outcome">{card.outcome}</p>
              </div>
              <div className="elo-monogram-wrap" title={`${card.name} monogram`}>
                {renderMonogram(card.monogram)}
              </div>
            </div>

            {/* Stats Row */}
            <div className="elo-stats-row">
              <div className="elo-stat-box">
                <div className="elo-stat-val">{card.stat1.value}</div>
                <div className="elo-stat-lbl">{card.stat1.label}</div>
              </div>
              <div className="elo-stat-divider" aria-hidden="true" />
              <div className="elo-stat-box">
                <div className="elo-stat-val">{card.stat2.value}</div>
                <div className="elo-stat-lbl">{card.stat2.label}</div>
              </div>
            </div>

            {/* Photo Framed by Stacked Translucent "Paper" Layers */}
            <div className="elo-photo-stack">
              <div className="elo-paper elo-paper-back" aria-hidden="true" />
              <div className="elo-paper elo-paper-mid" aria-hidden="true" />
              <div className="elo-photo-frame">
                <img
                  src={card.image}
                  alt={card.alt}
                  loading="lazy"
                  className="elo-photo-img"
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Centered White Pill Button */}
      <div className="elo-footer-btn-wrap">
        <a
          href="#get-started"
          className="elo-view-more-btn"
          onClick={(e) => {
            const target = document.getElementById('get-started');
            if (target) {
              e.preventDefault();
              target.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          Lihat Katalog Kos Terdekat
        </a>
      </div>
    </div>
  );
}

export default CaseResultsSection;
