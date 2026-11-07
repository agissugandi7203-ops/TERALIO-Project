import React, { useState } from 'react';
import { Star, MessageSquareCheck, ThumbsUp, ArrowRight, User } from 'lucide-react';
import { useAtmosphere } from '../context/AtmosphereContext.jsx';

export const HEALTHKATHON_TESTIMONIALS = [
  {
    id: 1,
    name: 'Ahmad Fauzi',
    jobTitle: 'Mahasiswa Informatika Telkom University',
    content:
      'Dulu saya dan teman-teman butuh 7 hari keliling gang Sukapura dan Sukabirus buat cari kos. Di Teralio, asisten AI langsung kasih opsi kos yang bebas banjir lengkap rute jalan kaki 650 meter ke kampus.',
    avatar: 'https://framerusercontent.com/images/gDcaZH5xt6hqSU2VbK2snAw.jpg?width=150&height=150',
    initials: 'AF',
  },
  {
    id: 2,
    name: 'Nabila Putri',
    jobTitle: 'Mahasiswi SITH ITB Bandung',
    content:
      'Sangat terbantu dengan fitur Budget Intelligence-nya. Gak ada lagi drama biaya token listrik atau air tersembunyi, semua rincian sewa pokok dan utilitas dihitung transparan dari awal.',
    avatar: 'https://framerusercontent.com/images/X0ECJ5xGgYrCVgHB8RYd3RABTQ.jpg?width=150&height=150',
    initials: 'NP',
  },
  {
    id: 3,
    name: 'H. Dedi Suhendar',
    jobTitle: 'Pemilik Kos Pondok Barokah (Kawasan PGA Telkom)',
    content:
      'Sebagai pemilik kos, saya senang bisa langsung berkomunikasi dengan calon penyewa tanpa dipotong komisi makelar. Jadwal survei kunjungan mahasiswa juga rapi masuk ke kalender.',
    avatar: 'https://framerusercontent.com/images/622M5cyJBdKPIK1fPnBlo3qONk.jpg?width=150&height=150',
    initials: 'DS',
  },
  {
    id: 4,
    name: 'Dimas Pratama',
    jobTitle: 'Mahasiswa Baru UTB Bandung',
    content:
      'Fitur suaranya keren banget! Tinggal ngomong cari kos dekat kampus UTB Soekarno-Hatta yang ada kamar mandi dalam, kamera peta langsung mengarahkan ke lokasinya.',
    avatar: 'https://framerusercontent.com/images/7Z2d6WeDiCpoz0B6ookMTPOFAU.jpg?width=800&height=920',
    initials: 'DP',
  },
  {
    id: 5,
    name: 'Sarah Maulida',
    jobTitle: 'Mahasiswi Rantau UI Depok',
    content:
      'Pencarian hunian yang benar-benar paham kebutuhan anak rantau. Perhitungan estimasi biaya hidup dan jarak jalan kaki ke stasiun serta gerbang kampus sangat presisi.',
    avatar: 'https://framerusercontent.com/images/QJxW9eYj0OFH6UvNuY4WNkVNJ0.jpg?width=800&height=900',
    initials: 'SM',
  },
];

export function TestimonialsSection({ onAction }) {
  const { isNight } = useAtmosphere();
  const [imgErrors, setImgErrors] = useState({});

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const handleImgError = (idx) => {
    setImgErrors((prev) => ({ ...prev, [idx]: true }));
  };

  const repeatedList = [...HEALTHKATHON_TESTIMONIALS, ...HEALTHKATHON_TESTIMONIALS];

  return (
    <section
      id="customers"
      data-testid="customers-page"
      className="relative w-full overflow-hidden transition-colors duration-500"
      style={{
        padding: '50px 0 130px',
        backgroundColor: isNight ? '#0a101d' : '#ffffff',
      }}
    >
      {/* Background Meadow / Taman Bunga — Hanya tampil saat terang (Morning), dihilangkan saat gelap (Night) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: isNight ? 0 : 0.85,
          backgroundImage:
            'url("https://framerusercontent.com/images/cQBpXWVe2IileA0HCzW5W4uvgY.jpg?width=1920&height=1080&format=webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          display: isNight ? 'none' : 'block',
        }}
      />

      {/* Top & Bottom Seamless Gradient Fades (Menyatu dengan latar atas dan bawah saat terang) */}
      {!isNight && (
        <>
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none transition-opacity duration-500"
            style={{
              height: '200px',
              background: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-500"
            style={{
              height: '200px',
              background: 'linear-gradient(0deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
            }}
          />
        </>
      )}

      {/* Header Container */}
      <div className="relative z-10 max-w-[1260px] mx-auto px-6 sm:px-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          {/* Left Column: PreTitle + H2 + 3 Feature Pills */}
          <div className="flex flex-col items-start gap-4 max-w-2xl">
            {/* PreTitle Badge */}
            <span
              className="inline-flex items-center px-3.5 py-1 text-xs font-semibold rounded-full border transition-colors"
              style={{
                backgroundColor: isNight ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 165, 233, 0.1)',
                borderColor: isNight ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.25)',
                color: isNight ? '#38bdf8' : '#0284c7',
                letterSpacing: '0.04em',
              }}
            >
              Testimoni
            </span>

            {/* H2 Title */}
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.12]"
              style={{
                color: isNight ? '#ffffff' : '#111827',
              }}
            >
              Dipercaya oleh Ribuan Mahasiswa &amp; Pemilik Kos
            </h2>

            {/* 3 ListItem Feature Pills with Vertical Dividers */}
            <div
              className="flex items-center flex-wrap gap-3 sm:gap-5 mt-2 text-xs sm:text-sm font-medium"
              style={{
                color: isNight ? '#cbd5e1' : '#334155',
              }}
            >
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>4.9 / 5 Peringkat Rata-Rata</span>
              </div>

              <div
                className="hidden sm:block w-[1px] h-4"
                style={{ backgroundColor: isNight ? 'rgba(255,255,255,0.15)' : '#cbd5e1' }}
              />

              <div className="flex items-center gap-1.5">
                <MessageSquareCheck className="w-4 h-4 text-emerald-500" />
                <span>Ulasan Penghuni Terverifikasi</span>
              </div>

              <div
                className="hidden sm:block w-[1px] h-4"
                style={{ backgroundColor: isNight ? 'rgba(255,255,255,0.15)' : '#cbd5e1' }}
              />

              <div className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4 text-sky-500" />
                <span>98% Kepuasan Mahasiswa</span>
              </div>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleAction}
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg cursor-pointer"
              style={{
                backgroundColor: isNight ? '#ffffff' : '#0f172a',
                color: isNight ? '#0f172a' : '#ffffff',
                boxShadow: isNight
                  ? '0 10px 25px -5px rgba(255, 255, 255, 0.2)'
                  : '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
              }}
            >
              <span>Mulai Sekarang</span>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5"
                style={{
                  backgroundColor: isNight ? '#0f172a' : '#ffffff',
                  color: isNight ? '#ffffff' : '#0f172a',
                }}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Marquee Carousel Track */}
      <div className="relative z-10 w-full overflow-hidden py-4">
        <div className="testimonials-marquee-track flex gap-6 px-6 w-max hover:[animation-play-state:paused]">
          {repeatedList.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="w-[320px] sm:w-[380px] flex-none rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: isNight ? 'rgba(18, 28, 48, 0.85)' : '#ffffff',
                border: isNight ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                backdropFilter: 'blur(12px)',
                boxShadow: isNight
                  ? '0 16px 36px -8px rgba(0, 0, 0, 0.5)'
                  : '0 14px 30px -8px rgba(15, 23, 42, 0.08)',
              }}
            >
              {/* Top: 5 Stars */}
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, sIdx) => (
                    <Star key={sIdx} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Content */}
                <p
                  className="text-sm sm:text-base leading-relaxed font-normal"
                  style={{
                    color: isNight ? '#e2e8f0' : '#334155',
                  }}
                >
                  "{item.content}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t"
                style={{
                  borderColor: isNight ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                }}
              >
                <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                  {!imgErrors[`${item.id}-${idx}`] ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      onError={() => handleImgError(`${item.id}-${idx}`)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span style={{ color: isNight ? '#38bdf8' : '#0284c7' }}>
                      {item.initials}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className="font-semibold text-sm leading-tight"
                    style={{
                      color: isNight ? '#ffffff' : '#0f172a',
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    className="text-xs mt-0.5"
                    style={{
                      color: isNight ? '#94a3b8' : '#64748b',
                    }}
                  >
                    {item.jobTitle}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
