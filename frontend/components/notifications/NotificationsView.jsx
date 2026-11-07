import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Calendar,
  Home,
  ShieldCheck,
  Tag,
  Clock,
  Trash2,
  CheckCheck,
  MapPin,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

const STORAGE_KEY = 'teralio_user_notifications';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'room',
    title: 'Kamar Baru Tersedia di Sukapura Loft!',
    message: '1 unit kamar tipe Studio di lantai 2 baru saja kosong. Fasilitas: kamar mandi dalam, AC, water heater, dan token mandiri.',
    price: 'Rp1.350.000 / bln',
    time: '5 menit lalu',
    timestamp: Date.now() - 5 * 60 * 1000,
    isRead: false,
    priority: 'high',
    kosName: 'Sukapura Loft',
    badge: 'Unit Baru',
    actionType: 'map',
  },
  {
    id: 'notif-2',
    category: 'schedule',
    title: 'Konfirmasi Jadwal Survei Kos',
    message: 'Pemilik Kos D’Paragon Telkom telah mengonfirmasi kunjungan survei Anda untuk besok pukul 14:00 WIB.',
    time: '25 menit lalu',
    timestamp: Date.now() - 25 * 60 * 1000,
    isRead: false,
    priority: 'urgent',
    kosName: "D'Paragon Telkom",
    badge: 'Terkonfirmasi',
    actionType: 'schedule',
  },
  {
    id: 'notif-3',
    category: 'verified',
    title: 'Kecepatan Wi-Fi Terverifikasi 100 Mbps',
    message: 'Kos Harmoni Putri telah diverifikasi langsung oleh tim AI Teralio dengan kecepatan unduh 102 Mbps dan latensi 6ms stabil.',
    time: '2 jam lalu',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    isRead: false,
    priority: 'normal',
    kosName: 'Kos Harmoni Putri',
    badge: '100 Mbps Fiber',
    actionType: 'chat',
  },
  {
    id: 'notif-4',
    category: 'promo',
    title: 'Promo Spesial Mahasiswa Baru Telkom University',
    message: 'Dapatkan potongan biaya sewa 10% untuk pembayaran semesteran pertama di Pondok Asri Buah Batu.',
    price: 'Hemat Rp900.000',
    time: '5 jam lalu',
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    isRead: true,
    priority: 'normal',
    kosName: 'Pondok Asri Buah Batu',
    badge: 'Diskon 10%',
    actionType: 'map',
  },
  {
    id: 'notif-5',
    category: 'security',
    title: 'Peningkatan Keamanan Access Card RFID',
    message: 'Graha Mulia Pasirluyu kini dilengkapi sistem gerbang otomatis dengan kartu akses RFID 24 jam dan 8 titik CCTV baru.',
    time: 'Kemarin',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    isRead: true,
    priority: 'normal',
    kosName: 'Graha Mulia Pasirluyu',
    badge: 'Smart Access',
    actionType: 'chat',
  },
];

export function NotificationsView({ user = null, onNavigate, onFocusKosOnMap }) {
  const storageKey = `teralio_user_notifications_${user?.id || 'guest'}`;

  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.warn('[NotificationsView] Failed to load notifications:', err);
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [activeFilter, setActiveFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setNotifications(JSON.parse(saved));
        } else {
          setNotifications(INITIAL_NOTIFICATIONS);
        }
      } catch {
        // ignore
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(notifications));
      } catch (err) {
        console.warn('[NotificationsView] Failed to save notifications:', err);
      }
    }
  }, [notifications, storageKey]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    if (activeFilter === 'room') {
      return notifications.filter((n) => n.category === 'room');
    }
    if (activeFilter === 'schedule') {
      return notifications.filter((n) => n.category === 'schedule');
    }
    if (activeFilter === 'promo') {
      return notifications.filter((n) => n.category === 'promo' || n.category === 'verified');
    }
    return notifications;
  }, [notifications, activeFilter]);

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  const handleToggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: !item.isRead } : item))
    );
  };

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setToastMessage('Notifikasi berhasil dihapus');
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setToastMessage('Semua notifikasi telah ditandai sebagai dibaca');
  };

  const handleClearRead = () => {
    setNotifications((prev) => prev.filter((item) => !item.isRead));
    setToastMessage('Notifikasi yang sudah dibaca telah dibersihkan');
  };

  const handleNotificationAction = (notif) => {
    handleMarkAsRead(notif.id);
    if (notif.actionType === 'map' && onFocusKosOnMap) {
      onFocusKosOnMap({ name: notif.kosName }, { switchToMap: true });
    } else if (notif.actionType === 'schedule' && onNavigate) {
      onNavigate('schedule');
    } else if (notif.actionType === 'chat' && onNavigate) {
      onNavigate('chat');
    }
  };

  const getCategoryMeta = (category) => {
    switch (category) {
      case 'room':
        return {
          icon: <Home className="w-4 h-4 text-emerald-600" />,
          label: 'Kamar Baru',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'schedule':
        return {
          icon: <Calendar className="w-4 h-4 text-blue-600" />,
          label: 'Jadwal Survei',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'verified':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
          label: 'Verifikasi AI',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'promo':
        return {
          icon: <Tag className="w-4 h-4 text-amber-600" />,
          label: 'Promo & Diskon',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'security':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-sky-600" />,
          label: 'Fasilitas & Keamanan',
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-600" />,
          label: 'Pemberitahuan',
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 px-1 sm:px-2" data-testid="notifications-view">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm animate-fade-in border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Controls & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Aktivitas & Notifikasi Hunian
              </h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Pembaruan langsung mengenai kos favorit, jadwal survei, dan rekomendasi AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Tandai semua telah dibaca"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Dibaca</span>
            </button>
          )}

          {notifications.some((n) => n.isRead) && (
            <button
              type="button"
              onClick={handleClearRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors"
              title="Hapus notifikasi yang sudah dibaca"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bersihkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Strip */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
        {[
          { id: 'all', label: 'Semua', count: notifications.length },
          { id: 'unread', label: 'Belum Dibaca', count: unreadCount },
          { id: 'room', label: 'Kamar Baru', icon: Home },
          { id: 'schedule', label: 'Jadwal Survei', icon: Calendar },
          { id: 'promo', label: 'Verifikasi & Promo', icon: Sparkles },
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm font-semibold'
                  : 'bg-white/90 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-800">Tidak ada notifikasi</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {activeFilter === 'unread'
                ? 'Semua notifikasi sudah dibaca. Anda selalu up-to-date!'
                : 'Belum ada notifikasi dalam kategori ini.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const meta = getCategoryMeta(notif.category);
            return (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id)}
                className={`group relative flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  notif.isRead
                    ? 'bg-white/70 hover:bg-white border-slate-200/70 text-slate-600'
                    : 'bg-gradient-to-r from-blue-50/70 via-white to-white border-blue-200 shadow-sm text-slate-800'
                }`}
              >
                {/* Unread indicator dot */}
                {!notif.isRead && (
                  <span
                    className="absolute top-4 left-3 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-100"
                    title="Belum dibaca"
                  />
                )}

                <div className="flex items-start gap-3.5 pl-2 sm:pl-3">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-xs ${
                      notif.isRead
                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                        : 'bg-white border-blue-200 text-blue-600'
                    }`}
                  >
                    {meta.icon}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${meta.badgeClass}`}
                      >
                        {notif.badge || meta.label}
                      </span>
                      {notif.price && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          {notif.price}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {notif.time}
                      </span>
                    </div>

                    <h4
                      className={`text-sm sm:text-base font-bold leading-snug ${
                        notif.isRead ? 'text-slate-700' : 'text-slate-900'
                      }`}
                    >
                      {notif.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>

                    {notif.kosName && (
                      <p className="text-xs font-medium text-slate-500 pt-0.5">
                        Properti:{' '}
                        <span className="text-slate-800 font-semibold">{notif.kosName}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 mt-1 sm:mt-0 pl-2 sm:pl-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationAction(notif);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-blue-600 transition-colors shadow-xs"
                  >
                    {notif.actionType === 'map' && (
                      <>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Buka Peta</span>
                      </>
                    )}
                    {notif.actionType === 'schedule' && (
                      <>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Lihat Jadwal</span>
                      </>
                    )}
                    {notif.actionType === 'chat' && (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Tanya AI</span>
                      </>
                    )}
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRead(notif.id);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title={notif.isRead ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Hapus notifikasi ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationsView;
