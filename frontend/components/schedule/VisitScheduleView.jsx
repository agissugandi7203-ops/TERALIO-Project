import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { smartKosApi } from '../../services/smartKosApi.js';

const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const QUICK_TIME_SLOTS = ['09:00 WIB', '10:30 WIB', '13:00 WIB', '14:00 WIB', '16:00 WIB', '19:00 WIB'];

const StaticWaveSmallIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4.5 10v4M8.25 7v10M12 4.5v15M15.75 7.5v9M19.5 10v4"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

function getTodayIsoWib() {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function getTomorrowIsoWib() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(tomorrow);
  } catch {
    return tomorrow.toISOString().slice(0, 10);
  }
}

function formatMonthYearLabel(year, monthZeroIndexed) {
  const dt = new Date(Date.UTC(year, monthZeroIndexed, 15, 12, 0, 0));
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(dt);
}

function formatReadableIsoDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || 'Jadwal Fleksibel';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dt);
}

function buildCalendarCells(year, monthZeroIndexed) {
  const firstDay = new Date(year, monthZeroIndexed, 1);
  // Konversi Minggu(0)..Sabtu(6) -> Senin(0)..Minggu(6)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${year}-${String(monthZeroIndexed + 1).padStart(2, '0')}-${String(day).padStart(
      2,
      '0',
    )}`;
    cells.push({ day, iso });
  }
  return cells;
}

export function VisitScheduleView({
  user = null,
  bookings = [],
  accommodations = [],
  highlightBookingId = null,
  initialSelectedDate = null,
  onBookingsChange,
  onOpenVoiceAssistant,
  onViewKosOnMap,
  onBackToOverview,
}) {
  const todayIso = useMemo(() => getTodayIsoWib(), []);
  const tomorrowIso = useMemo(() => getTomorrowIsoWib(), []);

  const [wibInfo, setWibInfo] = useState(null);
  const [filterDate, setFilterDate] = useState(initialSelectedDate || null);

  const initialRefIso = initialSelectedDate || todayIso;
  const [viewYear, setViewYear] = useState(() => Number(initialRefIso.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(initialRefIso.slice(5, 7)) - 1);

  // State form buat janji temu baru
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedKosId, setSelectedKosId] = useState('');
  const [newVisitDate, setNewVisitDate] = useState(tomorrowIso);
  const [newVisitTime, setNewVisitTime] = useState('14:00 WIB');
  const [newVisitNotes, setNewVisitNotes] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // State ubah jam / tanggal inline per booking
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState(null);

  useEffect(() => {
    let active = true;
    smartKosApi
      .fetchCurrentDatetime()
      .then((ctx) => {
        if (active && ctx) setWibInfo(ctx);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Sinkronkan kalender apabila diarahkan otomatis dari Voice / AI tool
  useEffect(() => {
    if (initialSelectedDate && /^\d{4}-\d{2}-\d{2}$/.test(initialSelectedDate)) {
      setViewYear(Number(initialSelectedDate.slice(0, 4)));
      setViewMonth(Number(initialSelectedDate.slice(5, 7)) - 1);
      setFilterDate(initialSelectedDate);
    }
  }, [initialSelectedDate]);

  useEffect(() => {
    if (!selectedKosId && accommodations.length > 0) {
      setSelectedKosId(accommodations[0].id);
    }
  }, [accommodations, selectedKosId]);

  const bookingsByDate = useMemo(() => {
    const map = new Map();
    for (const b of bookings) {
      if (b.status === 'Dibatalkan') continue;
      const iso = b.scheduledIso;
      if (iso) {
        map.set(iso, (map.get(iso) || 0) + 1);
      }
    }
    return map;
  }, [bookings]);

  const visibleBookings = useMemo(() => {
    if (!filterDate) return bookings;
    return bookings.filter((b) => b.scheduledIso === filterDate);
  }, [bookings, filterDate]);

  const activeBookingsCount = useMemo(
    () => bookings.filter((b) => b.status !== 'Dibatalkan').length,
    [bookings],
  );

  const calendarCells = useMemo(
    () => buildCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    setViewYear(Number(todayIso.slice(0, 4)));
    setViewMonth(Number(todayIso.slice(5, 7)) - 1);
    setFilterDate(null);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (isSubmittingNew) return;
    const chosenKos = accommodations.find((k) => k.id === selectedKosId) || accommodations[0];
    if (!chosenKos) return;

    setIsSubmittingNew(true);
    try {
      const created = await smartKosApi.createSurveyBooking({
        accommodationId: chosenKos.id,
        accommodationName: chosenKos.name,
        campusName: chosenKos.campusName || '',
        address: chosenKos.address || '',
        ownerName: chosenKos.contact?.ownerName || 'Pengelola Kos',
        contactPhone: chosenKos.contact?.phone || '',
        scheduledIso: newVisitDate,
        scheduledTime: newVisitTime,
        notes: newVisitNotes,
        visitorName: user?.fullName || 'Mahasiswa TERALIO',
      });
      onBookingsChange?.([created, ...bookings.filter((b) => b.id !== created.id)]);
      setIsCreatingNew(false);
      setNewVisitNotes('');
      setFilterDate(created.scheduledIso || null);
      setFeedbackBanner(`Janji temu ke ${created.accommodationName} berhasil disimpan (${created.scheduledLabel}).`);
    } catch (err) {
      setFeedbackBanner(err?.message || 'Gagal membuat janji temu.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const openInlineReschedule = (booking) => {
    setEditingBookingId(booking.id);
    setEditDate(booking.scheduledIso || tomorrowIso);
    setEditTime(booking.scheduledTime || '14:00 WIB');
  };

  const handleSaveReschedule = async (bookingId) => {
    if (isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      const updated = await smartKosApi.updateSurveyBooking(bookingId, {
        newDate: editDate,
        newTime: editTime,
        status: 'Diubah',
      });
      onBookingsChange?.(bookings.map((b) => (b.id === bookingId ? updated : b)));
      setEditingBookingId(null);
      if (filterDate && updated.scheduledIso !== filterDate) {
        setFilterDate(updated.scheduledIso);
      }
      setFeedbackBanner(`Jadwal janji temu berhasil diperbarui ke ${updated.scheduledLabel}.`);
    } catch (err) {
      setFeedbackBanner(err?.message || 'Gagal memperbarui jadwal janji temu.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteAppointment = async (bookingId) => {
    try {
      await smartKosApi.deleteSurveyBooking(bookingId);
      onBookingsChange?.(bookings.filter((b) => b.id !== bookingId));
      setFeedbackBanner('Janji temu survei telah dibatalkan.');
    } catch {
      onBookingsChange?.(bookings.filter((b) => b.id !== bookingId));
    }
  };

  return (
    <section
      className="visit-schedule-workspace"
      data-testid="subview-schedule"
      aria-label="Visit Schedule & Kalender Janji Temu Kos"
    >
      {/* Top Header */}
      <header className="visit-schedule-header">
        <div className="visit-schedule-header__titles">
          <div className="visit-schedule-eyebrow-row">
            <span className="visit-schedule-eyebrow">VISIT SCHEDULE</span>
            <span className="visit-schedule-wib-pill" data-testid="visit-schedule-wib-clock">
              <Clock size={12} />
              <span>
                {wibInfo
                  ? `${wibInfo.todayLabel} • ${wibInfo.currentTimeWib}`
                  : `Hari ini: ${formatReadableIsoDate(todayIso)}`}
              </span>
            </span>
          </div>
          <h2 className="visit-schedule-title">Kalender Kunjungan &amp; Janji Temu Kos</h2>
        </div>

        <div className="visit-schedule-header__actions">
          {onOpenVoiceAssistant && (
            <button
              type="button"
              className="visit-schedule-btn is-voice"
              onClick={onOpenVoiceAssistant}
              data-testid="schedule-open-voice-btn"
            >
              <StaticWaveSmallIcon />
              <span>Atur via Voice AI</span>
            </button>
          )}

          <button
            type="button"
            className="visit-schedule-btn is-primary"
            onClick={() => {
              setIsCreatingNew((prev) => !prev);
              if (filterDate) setNewVisitDate(filterDate);
            }}
            data-testid="schedule-new-booking-btn"
          >
            <Plus size={16} />
            <span>Buat Janji Temu</span>
          </button>

          {onBackToOverview && (
            <button
              type="button"
              className="visit-schedule-btn is-ghost"
              onClick={onBackToOverview}
            >
              ← Overview
            </button>
          )}
        </div>
      </header>

      {/* Notifikasi Sinkronisasi / Auto-Redirect AI */}
      {(feedbackBanner || highlightBookingId) && (
        <div className="visit-schedule-toast" data-testid="visit-schedule-banner">
          <CalendarCheck size={16} />
          <span>
            {feedbackBanner ||
              'Janji temu survei berhasil dijadwalkan oleh AI dan diarahkan ke kalender Anda.'}
          </span>
          {feedbackBanner && (
            <button
              type="button"
              className="visit-schedule-toast__close"
              onClick={() => setFeedbackBanner(null)}
              aria-label="Tutup pemberitahuan"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Drawer Form Buat Janji Temu Baru */}
      {isCreatingNew && (
        <form
          className="visit-schedule-create-card"
          onSubmit={handleCreateAppointment}
          data-testid="schedule-create-form"
        >
          <div className="visit-schedule-create-card__top">
            <strong>Jadwalkan Kunjungan Survei Kos Baru</strong>
            <button
              type="button"
              className="visit-schedule-icon-btn"
              onClick={() => setIsCreatingNew(false)}
              aria-label="Tutup form janji temu"
            >
              <X size={15} />
            </button>
          </div>

          <div className="visit-schedule-create-grid">
            <label className="visit-schedule-field">
              <span>Pilih Hunian Kos</span>
              <select
                value={selectedKosId}
                onChange={(e) => setSelectedKosId(e.target.value)}
                data-testid="schedule-select-kos"
              >
                {accommodations.map((kos) => (
                  <option key={kos.id} value={kos.id}>
                    {kos.name} — {kos.price} ({kos.campusName || kos.area})
                  </option>
                ))}
              </select>
            </label>

            <label className="visit-schedule-field">
              <span>Tanggal Kunjungan</span>
              <input
                type="date"
                value={newVisitDate}
                onChange={(e) => setNewVisitDate(e.target.value)}
                required
                data-testid="schedule-input-date"
              />
            </label>

            <label className="visit-schedule-field">
              <span>Jam Janji Temu (WIB)</span>
              <select
                value={newVisitTime}
                onChange={(e) => setNewVisitTime(e.target.value)}
                data-testid="schedule-select-time"
              >
                {QUICK_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>

            <label className="visit-schedule-field">
              <span>Catatan untuk Pengelola (Opsional)</span>
              <input
                type="text"
                value={newVisitNotes}
                onChange={(e) => setNewVisitNotes(e.target.value)}
                placeholder="Misal: Ingin cek kamar lantai 2 & parkir motor"
              />
            </label>
          </div>

          <div className="visit-schedule-create-actions">
            <button
              type="button"
              className="visit-schedule-btn is-ghost"
              onClick={() => setIsCreatingNew(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingNew}
              className="visit-schedule-btn is-primary"
              data-testid="schedule-submit-booking-btn"
            >
              <Check size={15} />
              <span>{isSubmittingNew ? 'Menyimpan...' : 'Simpan Janji Temu'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Main 2-Column Layout: Calendar (Kiri) + Daftar Janji Temu (Kanan) */}
      <div className="visit-schedule-grid">
        {/* KOLOM KIRI: INTERACTIVE MONTHLY CALENDAR */}
        <div className="visit-calendar-card" data-testid="visit-schedule-calendar">
          <div className="visit-calendar-card__top">
            <h3 className="visit-calendar-month">
              {formatMonthYearLabel(viewYear, viewMonth)}
            </h3>
            <div className="visit-calendar-nav">
              <button
                type="button"
                className="visit-calendar-today-btn"
                onClick={handleJumpToday}
              >
                Hari Ini
              </button>
              <button
                type="button"
                className="visit-calendar-arrow"
                onClick={handlePrevMonth}
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="visit-calendar-arrow"
                onClick={handleNextMonth}
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="visit-calendar-weekdays">
            {WEEKDAY_LABELS.map((wd) => (
              <span key={wd}>{wd}</span>
            ))}
          </div>

          <div className="visit-calendar-days">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="visit-calendar-day is-empty" />;
              }
              const count = bookingsByDate.get(cell.iso) || 0;
              const isToday = cell.iso === todayIso;
              const isSelected = filterDate === cell.iso;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => setFilterDate((prev) => (prev === cell.iso ? null : cell.iso))}
                  className={`visit-calendar-day ${isToday ? 'is-today' : ''} ${
                    isSelected ? 'is-selected' : ''
                  } ${count > 0 ? 'has-booking' : ''}`}
                  data-testid={`calendar-day-${cell.iso}`}
                >
                  <span className="visit-calendar-day__num">{cell.day}</span>
                  {count > 0 && (
                    <span className="visit-calendar-day__badge" aria-label={`${count} jadwal`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="visit-calendar-footer">
            <div className="visit-calendar-legend">
              <span>
                <i className="legend-dot is-today" /> Hari ini
              </span>
              <span>
                <i className="legend-dot is-booked" /> Ada janji temu ({activeBookingsCount})
              </span>
            </div>

            {filterDate && (
              <button
                type="button"
                className="visit-calendar-clear-filter"
                onClick={() => setFilterDate(null)}
                data-testid="schedule-filter-all"
              >
                Tampilkan Semua Tanggal ({bookings.length})
              </button>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: DAFTAR JANJI TEMU / APPOINTMENTS */}
        <div className="visit-appointments-panel" data-testid="visit-schedule-list">
          <div className="visit-appointments-panel__head">
            <div>
              <h3>
                {filterDate
                  ? `Janji Temu — ${formatReadableIsoDate(filterDate)}`
                  : 'Daftar Janji Temu Kunjungan Kos'}
              </h3>
              <p>
                {filterDate
                  ? `${visibleBookings.length} jadwal pada tanggal ini`
                  : `${activeBookingsCount} jadwal kunjungan aktif tersinkronisasi`}
              </p>
            </div>
            {filterDate && (
              <button
                type="button"
                className="visit-schedule-btn is-ghost"
                onClick={() => setFilterDate(null)}
              >
                Semua Jadwal
              </button>
            )}
          </div>

          {visibleBookings.length === 0 ? (
            <div className="visit-appointments-empty" data-testid="visit-schedule-empty">
              <div className="visit-appointments-empty__icon">
                <Calendar size={26} />
              </div>
              <h4>
                {filterDate
                  ? 'Belum ada janji temu di tanggal ini'
                  : 'Belum ada jadwal kunjungan kos'}
              </h4>
              <p>
                Anda dapat membuat janji temu secara langsung melalui tombol{' '}
                <strong>Buat Janji Temu</strong>, memilih kos di halaman{' '}
                <strong>Smart Kos Match</strong>, atau cukup bicara melalui{' '}
                <strong>Atur via Voice AI</strong> (misal: &ldquo;Jadwalkan survei ke kos dekat UTB
                besok jam 2 siang&rdquo;).
              </p>
              <div className="visit-appointments-empty__actions">
                <button
                  type="button"
                  className="visit-schedule-btn is-primary"
                  onClick={() => {
                    if (filterDate) setNewVisitDate(filterDate);
                    setIsCreatingNew(true);
                  }}
                >
                  <Plus size={15} />
                  <span>Buat Janji Temu Sekarang</span>
                </button>
                {onOpenVoiceAssistant && (
                  <button
                    type="button"
                    className="visit-schedule-btn is-voice"
                    onClick={onOpenVoiceAssistant}
                  >
                    <StaticWaveSmallIcon />
                    <span>Booking lewat Suara</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="visit-appointments-cards">
              {visibleBookings.map((booking) => {
                const isHighlighted = highlightBookingId === booking.id;
                const isEditing = editingBookingId === booking.id;
                const statusLower = String(booking.status || 'Terjadwal').toLowerCase();

                return (
                  <article
                    key={booking.id}
                    className={`visit-booking-card ${isHighlighted ? 'is-highlighted' : ''} ${
                      statusLower === 'dibatalkan' ? 'is-cancelled' : ''
                    }`}
                    data-testid={`booking-card-${booking.id}`}
                  >
                    <div className="visit-booking-card__time-col">
                      <span className="visit-booking-card__hour">
                        {booking.scheduledTime || '10:00 WIB'}
                      </span>
                      <span className="visit-booking-card__date">
                        {booking.scheduledIso || 'Terjadwal'}
                      </span>
                    </div>

                    <div className="visit-booking-card__body">
                      <div className="visit-booking-card__top-row">
                        <div>
                          <h4 className="visit-booking-card__title">
                            {booking.accommodationName}
                          </h4>
                          <span className="visit-booking-card__label">
                            {booking.scheduledLabel}
                          </span>
                        </div>

                        <span
                          className={`visit-booking-status ${
                            statusLower === 'diubah'
                              ? 'is-updated'
                              : statusLower === 'dibatalkan'
                                ? 'is-cancelled'
                                : 'is-confirmed'
                          }`}
                        >
                          {booking.status || 'Terjadwal'}
                        </span>
                      </div>

                      <div className="visit-booking-card__meta">
                        {booking.address && (
                          <span>
                            <MapPin size={13} /> {booking.address}
                          </span>
                        )}
                        <span>
                          <User size={13} /> {booking.ownerName || 'Pengelola Kos'}
                        </span>
                        {booking.contactPhone && (
                          <span>
                            <Phone size={13} /> {booking.contactPhone}
                          </span>
                        )}
                      </div>

                      {booking.notes && (
                        <p className="visit-booking-card__notes">Catatan: {booking.notes}</p>
                      )}

                      {/* Inline Reschedule Panel */}
                      {isEditing ? (
                        <div
                          className="visit-booking-reschedule"
                          data-testid={`reschedule-panel-${booking.id}`}
                        >
                          <div className="visit-booking-reschedule__row">
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              data-testid={`reschedule-date-${booking.id}`}
                            />
                            <div className="visit-booking-reschedule__slots">
                              {QUICK_TIME_SLOTS.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  className={`visit-slot-chip ${
                                    editTime === slot ? 'is-active' : ''
                                  }`}
                                  onClick={() => setEditTime(slot)}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="visit-booking-reschedule__actions">
                            <button
                              type="button"
                              className="visit-schedule-btn is-ghost"
                              onClick={() => setEditingBookingId(null)}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={isSavingEdit}
                              className="visit-schedule-btn is-primary"
                              onClick={() => handleSaveReschedule(booking.id)}
                              data-testid={`save-reschedule-btn-${booking.id}`}
                            >
                              <Check size={14} />
                              <span>{isSavingEdit ? 'Menyimpan...' : 'Simpan Jam Baru'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="visit-booking-card__actions">
                          <button
                            type="button"
                            className="visit-card-action-btn"
                            onClick={() => openInlineReschedule(booking)}
                            data-testid={`reschedule-btn-${booking.id}`}
                          >
                            <Edit3 size={13} />
                            <span>Ganti Jam / Tanggal</span>
                          </button>

                          {onViewKosOnMap && (
                            <button
                              type="button"
                              className="visit-card-action-btn"
                              onClick={() => onViewKosOnMap(booking)}
                            >
                              <MapPin size={13} />
                              <span>Lihat di Peta</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="visit-card-action-btn is-danger"
                            onClick={() => handleDeleteAppointment(booking.id)}
                            data-testid={`delete-booking-btn-${booking.id}`}
                          >
                            <Trash2 size={13} />
                            <span>Batalkan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default VisitScheduleView;
