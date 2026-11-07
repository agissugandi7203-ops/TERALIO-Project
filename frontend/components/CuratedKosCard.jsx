import React, { useState } from 'react';

const REVIEWER_AVATARS = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23334155'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23fde68a'/%3E%3Cpath d='M12 60c3-11 11-18 20-18s17 7 20 18' fill='%2394a3b8'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%230f766e'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23fed7aa'/%3E%3Cpath d='M12 60c3-11 11-18 20-18s17 7 20 18' fill='%232dd4bf'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%234338ca'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23fef08a'/%3E%3Cpath d='M12 60c3-11 11-18 20-18s17 7 20 18' fill='%23818cf8'/%3E%3C/svg%3E",
];

const CURATED_SPOTLIGHTS = [
  {
    title: 'Experience Quiet Nights at Kos Harmoni',
    badge: 'Quiet Study',
    copy: 'Peaceful acoustic-insulated rooms 650m from Telkom University. Private bathroom, 100 Mbps fiber Wi-Fi, and late-night study desk.',
  },
  {
    title: 'Experience the Comfort of Deep-Focus Living',
    badge: 'Deep Focus',
    copy: 'Discover verified student residences curated for restful nights and zero noise disruption. Wake up refreshed 8 minutes from campus.',
  },
  {
    title: 'Smart Furnished Studio at Sukapura Loft',
    badge: 'Furnished',
    copy: 'Move-in ready room at Rp1.350.000/mo with en-suite water heater, smart card security, and free communal pantry access.',
  },
  {
    title: 'Green Courtyard Living at Bojongsoang Suites',
    badge: 'Eco Breezy',
    copy: 'Sunlit cross-ventilated rooms surrounded by lush courtyard trees, dedicated bike shelter, and 24-hour CCTV protection.',
  },
  {
    title: 'Budget-Smart Residence at Dayeuhkolot Hub',
    badge: 'Best Value',
    copy: 'All-inclusive Rp1.150.000/mo student room with electricity included, laundry pickup point, and 5-minute walk to campus gate.',
  },
];

export const CuratedKosCard = () => {
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

        <div className="curated-card__callout">
          <span className="curated-card__badge">
            <span aria-hidden="true">🌙</span>
            <span>{current.badge}</span>
          </span>
          <p className="curated-card__copy">{current.copy}</p>
        </div>
      </div>

      <div className="curated-card__footer">
        <div className="curated-card__counter" data-testid="curated-counter">
          <strong>{index + 1}</strong>/{total}
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
