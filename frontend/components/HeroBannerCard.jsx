import React from 'react';

const MEMBER_AVATARS = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%237c2d12'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23fed7aa'/%3E%3Cpath d='M12 60c3-11 11-18 20-18s17 7 20 18' fill='%23fb923c'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%231e3a8a'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23fde68a'/%3E%3Cpath d='M12 60c3-11 11-18 20-18s17 7 20 18' fill='%2360a5fa'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%2314532d'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23fef08a'/%3E%3Cpath d='M12 60c3-11 11-18 20-18s17 7 20 18' fill='%234ade80'/%3E%3C/svg%3E",
];

export const HeroBannerCard = ({ onExploreVoice, onStartSession }) => {
  return (
    <section className="hero-bento-card" data-testid="hero-bento-card">
      <picture>
        <source srcSet="/dashboard-hero.webp" type="image/webp" />
        <img
          src="/dashboard-hero.jpg"
          alt="Mahasiswa menemukan kos impian bersama Asisten AI Teralio"
          className="hero-bento-card__bg-img"
          loading="eager"
          decoding="async"
        />
      </picture>
      <div className="hero-bento-card__gradient-scrim" aria-hidden="true" />

      <div>
        <h2 className="hero-bento-card__headline">
          Temukan Kos Impianmu
          <br />
          Dimulai di Sini!
        </h2>
      </div>

      <button
        type="button"
        className="hero-bento-card__center-play"
        onClick={onExploreVoice}
        data-testid="hero-explore-btn"
      >
        <span className="hero-play-circle" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
            <polygon points="8 5 19 12 8 19 8 5" />
          </svg>
        </span>
        <span className="hero-play-label">Eksplorasi Sekarang</span>
      </button>

      <div className="hero-bento-card__footer">
        <div>
          <p className="hero-members-caption">Bergabung bersama:</p>
          <div className="hero-members-row">
            <div className="avatar-stack" aria-hidden="true">
              {MEMBER_AVATARS.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt=""
                  className="avatar-stack__item"
                />
              ))}
            </div>
            <div className="hero-members-stat">
              <strong>5.8K+</strong>
              <span>Mahasiswa</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-hero-cta"
          onClick={onStartSession}
          data-testid="hero-start-btn"
        >
          <span>Mulai Sesi AI</span>
          <span className="btn-hero-cta__circle" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </button>
      </div>
    </section>
  );
};

export default HeroBannerCard;
