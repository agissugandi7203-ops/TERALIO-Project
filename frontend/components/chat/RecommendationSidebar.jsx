import React, { useEffect, useState } from 'react';
import InPlatformMapCanvas from '../map/InPlatformMapCanvas.jsx';
import '../../styles/smart-kos.css';

function normalizePhoneHref(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  return cleaned.length >= 6 ? `tel:${cleaned}` : null;
}

export function RecommendationSidebar({
  isOpen = false,
  items = [],
  queryContext = null,
  onOpenInSmartKos,
  onClose,
}) {
  const [expandedMapId, setExpandedMapId] = useState(null);

  // Otomatis tampilkan pratinjau peta in-platform pada rekomendasi teratas yang memiliki koordinat
  useEffect(() => {
    if (isOpen && Array.isArray(items) && items.length > 0) {
      const firstWithCoords = items.find(
        (it) =>
          it?.location &&
          typeof it.location.lat === 'number' &&
          typeof it.location.lng === 'number',
      );
      if (firstWithCoords) {
        setExpandedMapId(firstWithCoords.id);
      }
    }
  }, [isOpen, items]);

  if (!isOpen || !Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <aside
      className="chat-rec-sidebar"
      aria-label="Rekomendasi Kos dan Lokasi"
      data-testid="recommendation-sidebar"
    >
      <header className="chat-rec-sidebar__header">
        <div className="chat-rec-sidebar__heading">
          <span className="chat-rec-sidebar__eyebrow">Rekomendasi Terverifikasi</span>
          <h3 className="chat-rec-sidebar__title">
            {queryContext ? `Hasil untuk "${queryContext}"` : `${items.length} Lokasi Ditemukan`}
          </h3>
        </div>

        <button
          type="button"
          className="chat-rec-sidebar__close"
          onClick={onClose}
          aria-label="Tutup panel rekomendasi"
          data-testid="close-recommendation-sidebar-btn"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      <div className="chat-rec-sidebar__list" data-testid="recommendation-list">
        {items.map((item) => {
          const phoneHref = normalizePhoneHref(item.contact?.phone);
          const hasCoords =
            item.location &&
            typeof item.location.lat === 'number' &&
            typeof item.location.lng === 'number';
          const isMapExpanded = expandedMapId === item.id;

          return (
            <article
              key={item.id}
              className="rec-place-card"
              data-testid={`recommendation-card-${item.id}`}
            >
              <div className="rec-place-card__top">
                <div className="rec-place-card__badges">
                  {item.category && (
                    <span className="rec-place-card__category">{item.category}</span>
                  )}
                  <span className="rec-place-card__source">{item.sourceLabel}</span>
                </div>

                {typeof item.rating === 'number' && (
                  <span className="rec-place-card__rating" title="Rating lokasi">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '3px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    {item.rating.toFixed(1)}
                    {typeof item.userRatingCount === 'number' && (
                      <span className="rec-place-card__rating-count">
                        ({item.userRatingCount})
                      </span>
                    )}
                  </span>
                )}
              </div>

              <h4 className="rec-place-card__name">{item.name}</h4>

              {item.price && <div className="rec-place-card__price">{item.price}</div>}

              {item.description && (
                <p className="rec-place-card__desc">{item.description}</p>
              )}

              {/* Alamat & Rute bila tersedia dari sumber asli */}
              {(item.address || item.routeSummary || item.openingStatus) && (
                <div className="rec-place-card__details">
                  {item.address && (
                    <div className="rec-place-card__detail-row">
                      <span className="rec-place-card__detail-icon" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" />
                          <circle cx="12" cy="11" r="2.2" />
                        </svg>
                      </span>
                      <span>{item.address}</span>
                    </div>
                  )}

                  {item.routeSummary && (
                    <div className="rec-place-card__detail-row is-route">
                      <span className="rec-place-card__detail-icon" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="6" cy="19" r="3" />
                          <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
                          <circle cx="18" cy="5" r="3" />
                        </svg>
                      </span>
                      <span>
                        {[item.routeSummary.distanceText, item.routeSummary.durationText]
                          .filter(Boolean)
                          .join(' • ')}
                        {item.routeSummary.targetLabel
                          ? ` ke ${item.routeSummary.targetLabel}`
                          : ''}
                      </span>
                    </div>
                  )}

                  {item.openingStatus && (
                    <div className="rec-place-card__detail-row">
                      <span className="rec-place-card__detail-icon" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <polyline points="12 7 12 12 15 14" />
                        </svg>
                      </span>
                      <span>{item.openingStatus}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Informasi Kontak Nyata (hanya ditampilkan jika benar-benar tersedia) */}
              {(item.contact?.phone || item.contact?.website) && (
                <div className="rec-place-card__contacts">
                  {item.contact.phone && (
                    <div className="rec-place-card__contact-item">
                      <span className="rec-place-card__contact-label">Telepon</span>
                      {phoneHref ? (
                        <a href={phoneHref} className="rec-place-card__contact-link">
                          {item.contact.phone}
                        </a>
                      ) : (
                        <span>{item.contact.phone}</span>
                      )}
                    </div>
                  )}

                  {item.contact.website && (
                    <div className="rec-place-card__contact-item">
                      <span className="rec-place-card__contact-label">Situs Web</span>
                      <a
                        href={item.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rec-place-card__contact-link"
                      >
                        Kunjungi situs ↗
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Fasilitas jika tersedia */}
              {Array.isArray(item.features) && item.features.length > 0 && (
                <div className="rec-place-card__features">
                  {item.features.slice(0, 5).map((feat, idx) => (
                    <span key={idx} className="rec-place-card__feature-tag">
                      {feat}
                    </span>
                  ))}
                </div>
              )}

              {/* Pratinjau Peta In-Platform TERALIO (Tanpa Iframe "Open with Maps") */}
              {isMapExpanded && hasCoords && (
                <div className="rec-place-card__map-preview">
                  <InPlatformMapCanvas
                    mini
                    mapType="satellite"
                    zoom={17}
                    selectedKos={{
                      id: item.id,
                      name: item.name,
                      lat: item.location.lat,
                      lng: item.location.lng,
                      price: item.price || item.name,
                    }}
                  />
                </div>
              )}

              {(hasCoords || item.mapUrl || onOpenInSmartKos) && (
                <div className="rec-place-card__actions">
                  {hasCoords && (
                    <button
                      type="button"
                      className="rec-place-card__btn-secondary"
                      onClick={() =>
                        setExpandedMapId((prev) => (prev === item.id ? null : item.id))
                      }
                      data-testid={`toggle-map-preview-${item.id}`}
                    >
                      {isMapExpanded ? 'Tutup Peta Mini' : 'Peta Mini'}
                    </button>
                  )}

                  {onOpenInSmartKos && hasCoords && (
                    <button
                      type="button"
                      className="rec-place-card__btn-primary"
                      onClick={() => onOpenInSmartKos(item)}
                      data-testid={`open-inplatform-overview-${item.id}`}
                    >
                      <span>Overview di Smart Kos</span>
                    </button>
                  )}

                  {item.mapUrl && !onOpenInSmartKos && (
                    <a
                      href={item.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rec-place-card__btn-primary"
                      data-testid={`open-maps-link-${item.id}`}
                    >
                      <span>Lihat di Peta</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </aside>
  );
}

export default RecommendationSidebar;
