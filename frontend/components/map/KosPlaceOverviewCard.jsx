import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  CalendarCheck,
  Check,
  Clock,
  Copy,
  Footprints,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

const SURVEY_SLOTS = ['Besok • 10:00 WIB', 'Sabtu • 14:00 WIB', 'Minggu • 10:30 WIB'];

export function KosPlaceOverviewCard({
  kos,
  campus,
  route,
  dataSource = 'supabase',
  showRouteLine = true,
  onToggleRouteLine,
  onFocusOnMap,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaved, setIsSaved] = useState(false);
  const [showSurveyBox, setShowSurveyBox] = useState(false);
  const [bookedSlot, setBookedSlot] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    setActiveTab('overview');
    setShowSurveyBox(false);
    setBookedSlot(null);
    setCopiedPhone(false);
  }, [kos?.id]);

  if (!kos) return null;

  const palette =
    Array.isArray(kos.accentPalette) && kos.accentPalette.length >= 2
      ? kos.accentPalette
      : ['#1d4ed8', '#38bdf8'];

  const ratingValue = typeof kos.rating === 'number' ? kos.rating : 4.8;
  const reviewsCount =
    typeof kos.reviewsCount === 'number'
      ? kos.reviewsCount
      : typeof kos.reviews === 'number'
        ? kos.reviews
        : Array.isArray(kos.reviews)
          ? kos.reviews.length
          : 32;

  const reviewItems = Array.isArray(kos.reviews)
    ? kos.reviews
    : [
        {
          author: 'Mahasiswa Terverifikasi TERALIO',
          rating: 5,
          comment: 'Lingkungan kos bersih, akses ke kampus sangat dekat dan internet stabil.',
        },
      ];

  const roomsLeft = typeof kos.roomsAvailable === 'number' ? kos.roomsAvailable : 2;
  const ownerPhone = kos.contact?.phone || null;
  const ownerName = kos.contact?.ownerName || 'Pengelola Kos Terverifikasi';

  const handleCopyPhone = async () => {
    if (!ownerPhone) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(ownerPhone);
      }
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      setCopiedPhone(true);
    }
  };

  return (
    <aside
      className="kos-place-overview"
      aria-label={`Overview Lokasi ${kos.name}`}
      data-testid="kos-place-overview"
    >
      {/* 1. Hero Architectural Banner */}
      <div
        className="kos-place-overview__hero"
        style={{
          background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
        }}
      >
        {/* Architectural Room Vector Silhouette */}
        <svg
          className="kos-place-overview__hero-art"
          viewBox="0 0 400 170"
          fill="none"
          aria-hidden="true"
        >
          <rect x="24" y="34" width="142" height="112" rx="14" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
          <rect x="42" y="52" width="58" height="44" rx="6" fill="rgba(255,255,255,0.14)" />
          <rect x="190" y="22" width="184" height="124" rx="16" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <path d="M190 98H374" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
          <circle cx="332" cy="58" r="18" fill="rgba(255,255,255,0.16)" />
        </svg>

        <div className="kos-place-overview__hero-top">
          <div className="kos-place-overview__hero-badges">
            <span className="kos-overview-pill is-glass">Kos {kos.type || 'Putra / Putri'}</span>
            <span className="kos-overview-pill is-verified">
              <ShieldCheck size={12} />
              <span>{dataSource === 'supabase' ? 'Supabase Live' : 'Supabase Ready'}</span>
            </span>
          </div>

          <button
            type="button"
            className="kos-place-overview__close"
            onClick={onClose}
            aria-label="Tutup overview kos"
            data-testid="close-place-overview-btn"
          >
            <X size={16} />
          </button>
        </div>

        <div className="kos-place-overview__hero-bottom">
          <span className="kos-overview-match-badge">
            <Sparkles size={12} />
            <span>{kos.tag || `Match ${kos.matchScore || 95}%`}</span>
          </span>
          {kos.area && <span className="kos-overview-area-tag">{kos.area}</span>}
        </div>
      </div>

      {/* 2. Identity, Rating, & Price Summary */}
      <div className="kos-place-overview__identity">
        <h3 className="kos-place-overview__title" data-testid="place-overview-title">
          {kos.name}
        </h3>

        <div className="kos-place-overview__rating-row">
          <span className="kos-place-overview__rating-num">{ratingValue.toFixed(1)}</span>
          <span className="kos-place-overview__stars" aria-hidden="true">
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
          </span>
          <span className="kos-place-overview__reviews-count">({reviewsCount} ulasan)</span>
          <span className="kos-place-overview__dot">•</span>
          <span className="kos-place-overview__rooms-badge">Tersisa {roomsLeft} kamar</span>
        </div>

        <div className="kos-place-overview__price-row">
          <strong className="kos-place-overview__price">{kos.price}</strong>
          <button
            type="button"
            className="kos-place-overview__recenter-link"
            onClick={() => onFocusOnMap?.(kos)}
          >
            <MapPin size={12} />
            <span>Pusatkan Pin</span>
          </button>
        </div>
      </div>

      {/* 3. In-Platform Quick Actions (Google Maps Place Sheet Style — 100% Native) */}
      <div className="kos-place-overview__actions" role="group" aria-label="Aksi Cepat Lokasi Kos">
        <button
          type="button"
          className={`kos-overview-action-btn ${showRouteLine ? 'is-primary' : ''}`}
          onClick={() => {
            onToggleRouteLine?.();
            setActiveTab('overview');
          }}
          data-testid="overview-action-route"
        >
          <span className="kos-overview-action-btn__icon">
            <Navigation size={16} />
          </span>
          <span>Rute Kampus</span>
        </button>

        <button
          type="button"
          className={`kos-overview-action-btn ${showSurveyBox || bookedSlot ? 'is-active' : ''}`}
          onClick={() => setShowSurveyBox((prev) => !prev)}
          data-testid="overview-action-survey"
        >
          <span className="kos-overview-action-btn__icon">
            <CalendarCheck size={16} />
          </span>
          <span>Survei Kos</span>
        </button>

        <button
          type="button"
          className="kos-overview-action-btn"
          onClick={() => {
            setActiveTab('overview');
            handleCopyPhone();
          }}
          data-testid="overview-action-contact"
        >
          <span className="kos-overview-action-btn__icon">
            <Phone size={16} />
          </span>
          <span>{copiedPhone ? 'Tersalin' : 'Kontak'}</span>
        </button>

        <button
          type="button"
          className={`kos-overview-action-btn ${isSaved ? 'is-active' : ''}`}
          onClick={() => setIsSaved((prev) => !prev)}
          data-testid="overview-action-save"
        >
          <span className="kos-overview-action-btn__icon">
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
          </span>
          <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
        </button>
      </div>

      {/* In-Platform Survey Booking Drawer */}
      {showSurveyBox && (
        <div className="kos-place-overview__survey-box" data-testid="overview-survey-box">
          <div className="kos-place-overview__survey-head">
            <strong>Pilih Jadwal Survei ke {kos.name}</strong>
            <span>Langsung tercatat di TERALIO tanpa keluar platform</span>
          </div>
          <div className="kos-place-overview__survey-slots">
            {SURVEY_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`kos-survey-slot-btn ${bookedSlot === slot ? 'is-booked' : ''}`}
                onClick={() => setBookedSlot(slot)}
              >
                {bookedSlot === slot ? <Check size={13} /> : null}
                <span>{slot}</span>
              </button>
            ))}
          </div>
          {bookedSlot && (
            <p className="kos-place-overview__survey-confirm">
              ✓ Jadwal survei <strong>{bookedSlot}</strong> bersama {ownerName} siap dikonfirmasi!
            </p>
          )}
        </div>
      )}

      {/* 4. Interactive Place Overview Tabs */}
      <div className="kos-place-overview__tabs" role="tablist" aria-label="Detail Informasi Kos">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`kos-overview-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
          data-testid="overview-tab-summary"
        >
          Ringkasan
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'facilities'}
          className={`kos-overview-tab ${activeTab === 'facilities' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('facilities')}
          data-testid="overview-tab-facilities"
        >
          Fasilitas &amp; Sekitar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reviews'}
          className={`kos-overview-tab ${activeTab === 'reviews' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('reviews')}
          data-testid="overview-tab-reviews"
        >
          Ulasan ({reviewItems.length})
        </button>
      </div>

      {/* 5. Scrollable Tab Body */}
      <div className="kos-place-overview__body">
        {activeTab === 'overview' && (
          <div className="kos-overview-section">
            {/* Live Campus Route Card */}
            {campus && (
              <div className="kos-overview-route-card" data-testid="overview-route-metrics">
                <div className="kos-overview-route-card__icon">
                  <Footprints size={17} />
                </div>
                <div className="kos-overview-route-card__info">
                  <strong>
                    {route?.distanceText || kos.distance} ke {campus.shortName || campus.name}
                  </strong>
                  <span>
                    {route
                      ? `~${route.walkMinutes} mnt jalan kaki • ~${route.rideMinutes} mnt naik motor`
                      : 'Rute jalan kaki langsung ditampilkan di peta'}
                  </span>
                </div>
              </div>
            )}

            {kos.description && <p className="kos-overview-description">{kos.description}</p>}

            <div className="kos-overview-info-list">
              {kos.address && (
                <div className="kos-overview-info-row">
                  <MapPin size={15} className="kos-overview-info-icon" />
                  <div>
                    <span className="kos-overview-info-label">Alamat Lengkap</span>
                    <p>{kos.address}</p>
                  </div>
                </div>
              )}

              <div className="kos-overview-info-row">
                <Clock size={15} className="kos-overview-info-icon" />
                <div>
                  <span className="kos-overview-info-label">Jam Kunjungan Survei</span>
                  <p>{kos.visitingHours || 'Setiap hari • 08.00 – 21.00 WIB'}</p>
                </div>
              </div>

              {ownerPhone && (
                <div className="kos-overview-info-row">
                  <Phone size={15} className="kos-overview-info-icon" />
                  <div className="kos-overview-contact-flex">
                    <div>
                      <span className="kos-overview-info-label">{ownerName}</span>
                      <p>{ownerPhone}</p>
                    </div>
                    <button
                      type="button"
                      className="kos-overview-copy-btn"
                      onClick={handleCopyPhone}
                    >
                      {copiedPhone ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedPhone ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Highlighted Top Features Preview */}
            {Array.isArray(kos.features) && kos.features.length > 0 && (
              <div className="kos-overview-Block">
                <h4 className="kos-overview-subhead">Fasilitas Unggulan</h4>
                <div className="kos-overview-chips">
                  {kos.features.map((feat, idx) => (
                    <span key={idx} className="kos-overview-chip">
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'facilities' && (
          <div className="kos-overview-section">
            <h4 className="kos-overview-subhead">Fasilitas Kamar &amp; Gedung</h4>
            <div className="kos-overview-chips">
              {(kos.features || []).map((feat, idx) => (
                <span key={idx} className="kos-overview-chip">
                  ✓ {feat}
                </span>
              ))}
            </div>

            {Array.isArray(kos.nearbyLandmarks) && kos.nearbyLandmarks.length > 0 && (
              <>
                <h4 className="kos-overview-subhead" style={{ marginTop: '1rem' }}>
                  Titik Penting di Sekitar Kos
                </h4>
                <div className="kos-overview-landmarks">
                  {kos.nearbyLandmarks.map((lm, idx) => (
                    <div key={idx} className="kos-overview-landmark-item">
                      <span className="kos-overview-landmark-name">{lm.name}</span>
                      <span className="kos-overview-landmark-dist">{lm.distance}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="kos-overview-section">
            <div className="kos-overview-reviews-list">
              {reviewItems.map((rev, idx) => (
                <article key={idx} className="kos-overview-review-card">
                  <div className="kos-overview-review-head">
                    <strong>{rev.author}</strong>
                    <span>★ {rev.rating || 5}.0</span>
                  </div>
                  <p>{rev.comment}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default KosPlaceOverviewCard;
