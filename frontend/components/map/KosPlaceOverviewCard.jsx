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
      timeWib: times[idx],
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
        size={12}
        fill={filled ? '#fbbc04' : 'none'}
        color={filled ? '#fbbc04' : '#dadce0'}
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
  showRouteLine = true,
  onToggleRouteLine,
  onFocusOnMap,
  onSurveyBooked,
  onOpenSchedule,
  onClose,
}) {
  const [savedIds, setSavedIds] = useState(() => readSavedKosIds());
  const [showSurveyBox, setShowSurveyBox] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedRecord, setBookedRecord] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
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
        scheduledTime: slot.timeWib,
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
      className="kos-place-overview is-gmaps-minimal"
      aria-label={`Overview Lokasi ${kos.name}`}
      data-testid="kos-place-overview"
    >
      {/* Header Minimalis Khas Google Maps */}
      <div className="kos-gmaps-card__header">
        <div className="kos-gmaps-card__title-row">
          <h3 className="kos-gmaps-card__title" data-testid="place-overview-title">
            {kos.name}
          </h3>
          <button
            type="button"
            className="kos-gmaps-card__close"
            onClick={onClose}
            aria-label="Tutup overview kos"
            data-testid="close-place-overview-btn"
          >
            <X size={16} />
          </button>
        </div>

        <div className="kos-gmaps-card__meta">
          <span className="kos-gmaps-card__rating" data-testid="place-overview-rating">
            {ratingValue.toFixed(1)}
          </span>
          <span className="kos-gmaps-card__stars" aria-hidden="true">
            {renderDynamicStars(ratingValue)}
          </span>
          {reviewsCount > 0 && <span className="kos-gmaps-card__muted">({reviewsCount})</span>}
          <span className="kos-gmaps-card__dot">·</span>
          <span className="kos-gmaps-card__muted">Kos {kos.type || 'Putra / Putri'}</span>
        </div>

        <div className="kos-gmaps-card__price-line">
          <strong className="kos-gmaps-card__price">{kos.price}</strong>
          {roomsLeft !== null && (
            <span className="kos-gmaps-card__rooms">Sisa {roomsLeft} kamar</span>
          )}
        </div>
      </div>

      {/* Deretan Pill Action Khas Google Maps */}
      <div className="kos-gmaps-card__pills" role="group" aria-label="Aksi Cepat Lokasi Kos">
        <button
          type="button"
          className={`kos-gmaps-pill ${showRouteLine ? 'is-filled' : ''}`}
          onClick={() => {
            onToggleRouteLine?.();
            onFocusOnMap?.(kos);
          }}
          data-testid="overview-action-route"
        >
          <Navigation size={14} />
          <span>Rute</span>
        </button>

        <button
          type="button"
          className={`kos-gmaps-pill ${showSurveyBox || bookedRecord ? 'is-tonal' : ''}`}
          onClick={() => setShowSurveyBox((prev) => !prev)}
          data-testid="overview-action-survey"
        >
          <CalendarCheck size={14} />
          <span>Survei Kos</span>
        </button>

        <button
          type="button"
          className="kos-gmaps-pill"
          onClick={handleCopyPhone}
          disabled={!ownerPhone}
          data-testid="overview-action-contact"
        >
          <Phone size={14} />
          <span>{copiedPhone ? 'Tersalin' : 'Kontak'}</span>
        </button>

        <button
          type="button"
          className={`kos-gmaps-pill ${isSaved ? 'is-tonal' : ''}`}
          onClick={handleToggleSave}
          data-testid="overview-action-save"
        >
          <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
          <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
        </button>
      </div>

      {/* Inline Survey Slot Picker (Ringkas & Bersih) */}
      {showSurveyBox && (
        <div className="kos-gmaps-card__survey" data-testid="overview-survey-box">
          <span className="kos-gmaps-card__survey-label">Pilih jadwal kunjungan survei:</span>
          <div className="kos-gmaps-card__survey-slots">
            {dynamicSlots.map((slot) => {
              const selected = bookedRecord?.scheduledLabel === slot.label;
              return (
                <button
                  key={slot.label}
                  type="button"
                  disabled={isBooking}
                  className={`kos-gmaps-slot-btn ${selected ? 'is-booked' : ''}`}
                  onClick={() => handleBookSlot(slot)}
                  data-testid="overview-survey-slot-btn"
                >
                  {selected ? <Check size={12} /> : null}
                  <span>{slot.label}</span>
                </button>
              );
            })}
          </div>
          {bookingError && <p className="kos-gmaps-card__survey-err">{bookingError}</p>}
          {bookedRecord && (
            <div className="kos-gmaps-card__survey-ok" data-testid="overview-survey-confirmed">
              <span>
                <Check size={12} style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '4px' }} />
                Terjadwal <strong>{bookedRecord.scheduledLabel}</strong>
              </span>
              {onOpenSchedule && (
                <button
                  type="button"
                  className="kos-gmaps-card__schedule-link"
                  onClick={() => onOpenSchedule(bookedRecord)}
                >
                  Buka Kalender →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail Ringkas Satu Kolom Khas Google Maps */}
      <div className="kos-gmaps-card__details">
        {kos.address && (
          <div className="kos-gmaps-card__row">
            <MapPin size={15} className="kos-gmaps-card__icon" />
            <span>{kos.address}</span>
          </div>
        )}

        {campus && (
          <div className="kos-gmaps-card__row" data-testid="overview-route-metrics">
            <Footprints size={15} className="kos-gmaps-card__icon" />
            <span>
              {route?.distanceText || kos.distance} ke {campus.shortName || campus.name}
              {route?.walkMinutes ? ` (${route.walkMinutes} mnt jalan kaki)` : ''}
            </span>
          </div>
        )}

        {kos.visitingHours && (
          <div className="kos-gmaps-card__row">
            <Clock size={15} className="kos-gmaps-card__icon" />
            <span>{kos.visitingHours}</span>
          </div>
        )}

        {ownerPhone && (
          <div className="kos-gmaps-card__row is-contact">
            <Phone size={15} className="kos-gmaps-card__icon" />
            <span className="kos-gmaps-card__contact-text">
              {ownerPhone} · {ownerName}
            </span>
            <button
              type="button"
              className="kos-gmaps-card__copy"
              onClick={handleCopyPhone}
              aria-label="Salin nomor telepon"
            >
              {copiedPhone ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        )}

        {Array.isArray(kos.features) && kos.features.length > 0 && (
          <div className="kos-gmaps-card__tags">
            {kos.features.slice(0, 4).map((feat, idx) => (
              <span key={idx} className="kos-gmaps-card__tag">
                {feat}
              </span>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default KosPlaceOverviewCard;
