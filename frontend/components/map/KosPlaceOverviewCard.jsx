import React, { useEffect, useMemo, useState } from 'react';
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
import { smartKosApi } from '../../services/smartKosApi.js';

const SAVED_STORAGE_KEY = 'teralio_saved_kos_ids';

function readSavedKosIds() {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildDynamicSurveySlots(visitingHoursStr = '') {
  const hourMatches = String(visitingHoursStr).match(/(\d{1,2})[.:](\d{2})/g) || [];
  const startHour = hourMatches[0] ? Number.parseInt(hourMatches[0].split(/[.:]/)[0], 10) : 9;
  const morningSlot = `${String(Math.max(8, startHour + 1)).padStart(2, '0')}:00 WIB`;
  const afternoonSlot = '14:00 WIB';
  const lateAfternoonSlot = '16:30 WIB';
  const times = [morningSlot, afternoonSlot, lateAfternoonSlot];

  const baseNow = new Date();
  const formatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return [1, 2, 3].map((dayOffset, idx) => {
    const d = new Date(baseNow.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const isoDate = d.toISOString().slice(0, 10);
    const dayLabel = dayOffset === 1 ? `Besok (${formatter.format(d)})` : formatter.format(d);
    return {
      isoDate,
      label: `${dayLabel} • ${times[idx]}`,
    };
  });
}

function renderDynamicStars(ratingValue = 4.8) {
  const clamped = Math.max(0, Math.min(5, Number(ratingValue) || 0));
  return [1, 2, 3, 4, 5].map((starIndex) => {
    const filled = clamped >= starIndex - 0.25;
    return (
      <Star
        key={starIndex}
        size={13}
        fill={filled ? '#f59e0b' : 'none'}
        color={filled ? '#f59e0b' : '#cbd5e1'}
        data-star-filled={filled ? 'true' : 'false'}
      />
    );
  });
}

export function KosPlaceOverviewCard({
  kos,
  campus,
  route,
  userName = 'Mahasiswa TERALIO',
  dataSource = 'supabase',
  showRouteLine = true,
  onToggleRouteLine,
  onFocusOnMap,
  onSurveyBooked,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [savedIds, setSavedIds] = useState(() => readSavedKosIds());
  const [showSurveyBox, setShowSurveyBox] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedRecord, setBookedRecord] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    setActiveTab('overview');
    setShowSurveyBox(false);
    setBookedRecord(null);
    setBookingError(null);
    setCopiedPhone(false);
  }, [kos?.id]);

  const dynamicSlots = useMemo(
    () => buildDynamicSurveySlots(kos?.visitingHours),
    [kos?.id, kos?.visitingHours],
  );

  if (!kos) return null;

  const isSaved = savedIds.includes(kos.id);

  const handleToggleSave = () => {
    setSavedIds((prev) => {
      const next = prev.includes(kos.id)
        ? prev.filter((id) => id !== kos.id)
        : [...prev, kos.id];
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage restrictions
      }
      return next;
    });
  };

  const palette =
    Array.isArray(kos.accentPalette) && kos.accentPalette.length >= 2
      ? kos.accentPalette
      : ['#1d4ed8', '#38bdf8'];

  const ratingValue = typeof kos.rating === 'number' ? kos.rating : 4.8;
  const reviewItems = Array.isArray(kos.reviews) ? kos.reviews : [];
  const reviewsCount =
    typeof kos.reviewsCount === 'number'
      ? kos.reviewsCount
      : typeof kos.reviews === 'number'
        ? kos.reviews
        : reviewItems.length;

  const roomsLeft = typeof kos.roomsAvailable === 'number' ? kos.roomsAvailable : null;
  const ownerPhone = kos.contact?.phone || null;
  const ownerName = kos.contact?.ownerName || 'Pengelola Kos';

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

  const handleBookSlot = async (slot) => {
    if (isBooking) return;
    setIsBooking(true);
    setBookingError(null);

    try {
      const created = await smartKosApi.createSurveyBooking({
        accommodationId: kos.id,
        accommodationName: kos.name,
        campusName: campus?.name || kos.campusName || '',
        address: kos.address || '',
        ownerName,
        contactPhone: ownerPhone || '',
        scheduledLabel: slot.label,
        scheduledIso: slot.isoDate,
        visitorName: userName,
      });
      setBookedRecord(created);
      onSurveyBooked?.(created);
    } catch (err) {
      setBookingError(err?.message || 'Gagal menyimpan jadwal survei.');
    } finally {
      setIsBooking(false);
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
            {kos.verified !== false && (
              <span className="kos-overview-pill is-verified">
                <ShieldCheck size={12} />
                <span>{dataSource === 'supabase' ? 'Supabase Live' : 'Supabase Sync'}</span>
              </span>
            )}
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

      {/* 2. Identity, Dynamic Rating, & Price Summary */}
      <div className="kos-place-overview__identity">
        <h3 className="kos-place-overview__title" data-testid="place-overview-title">
          {kos.name}
        </h3>

        <div className="kos-place-overview__rating-row">
          <span className="kos-place-overview__rating-num" data-testid="place-overview-rating">
            {ratingValue.toFixed(1)}
          </span>
          <span className="kos-place-overview__stars" aria-hidden="true">
            {renderDynamicStars(ratingValue)}
          </span>
          {reviewsCount > 0 && (
            <span className="kos-place-overview__reviews-count">({reviewsCount} ulasan)</span>
          )}
          {roomsLeft !== null && (
            <>
              <span className="kos-place-overview__dot">•</span>
              <span className="kos-place-overview__rooms-badge">Tersisa {roomsLeft} kamar</span>
            </>
          )}
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

      {/* 3. In-Platform Quick Actions (100% Native di dalam TERALIO) */}
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
          className={`kos-overview-action-btn ${showSurveyBox || bookedRecord ? 'is-active' : ''}`}
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
          disabled={!ownerPhone}
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
          onClick={handleToggleSave}
          data-testid="overview-action-save"
        >
          <span className="kos-overview-action-btn__icon">
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
          </span>
          <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
        </button>
      </div>

      {/* Dynamic Survey Booking Drawer */}
      {showSurveyBox && (
        <div className="kos-place-overview__survey-box" data-testid="overview-survey-box">
          <div className="kos-place-overview__survey-head">
            <strong>Jadwalkan Survei ke {kos.name}</strong>
            <span>Otomatis tersimpan ke menu Schedule &amp; Supabase</span>
          </div>
          <div className="kos-place-overview__survey-slots">
            {dynamicSlots.map((slot) => {
              const selected = bookedRecord?.scheduledLabel === slot.label;
              return (
                <button
                  key={slot.label}
                  type="button"
                  disabled={isBooking}
                  className={`kos-survey-slot-btn ${selected ? 'is-booked' : ''}`}
                  onClick={() => handleBookSlot(slot)}
                  data-testid="overview-survey-slot-btn"
                >
                  {selected ? <Check size={13} /> : null}
                  <span>{slot.label}</span>
                </button>
              );
            })}
          </div>
          {bookingError && <p className="kos-place-overview__survey-error">{bookingError}</p>}
          {bookedRecord && (
            <p className="kos-place-overview__survey-confirm" data-testid="overview-survey-confirmed">
              ✓ Terjadwal pada <strong>{bookedRecord.scheduledLabel}</strong> bersama {ownerName}.
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

              {kos.visitingHours && (
                <div className="kos-overview-info-row">
                  <Clock size={15} className="kos-overview-info-icon" />
                  <div>
                    <span className="kos-overview-info-label">Jam Kunjungan Survei</span>
                    <p>{kos.visitingHours}</p>
                  </div>
                </div>
              )}

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

            {Array.isArray(kos.features) && kos.features.length > 0 && (
              <div className="kos-overview-block">
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
            {reviewItems.length === 0 ? (
              <p className="kos-overview-empty-reviews">
                Belum ada ulasan tertulis untuk hunian ini di database.
              </p>
            ) : (
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
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default KosPlaceOverviewCard;
