# Components - TERALIO UI Building Blocks

Direktori `frontend/components/` berisi unit antarmuka pengguna (UI) modular yang dapat digunakan kembali (*reusable*), terisolasi, dan independen dari logika routing.

---

## 1. Tanggung Jawab & Prinsip Desain

Setiap komponen dalam direktori ini wajib mematuhi standar Clean Code:
1. **Presentational Purity**: Mayoritas komponen harus bersifat murni (*pure/presentational*)—menerima data via `props` dan memancarkan aksi via `callbacks`.
2. **Keterisolasian State**: Komponen tidak boleh bergantung pada variabel global di luar modulnya sendiri atau memodifikasi props secara mutatif.
3. **Robustness & Null Safety**: Selalu antisipasi data kosong atau berstatus *loading* dengan menyediakan nilai fallback atau placeholder visual.
4. **Testability**: Selalu sertakan atribut `data-testid` pada kontainer utama dan elemen interaktif untuk memudahkan pengujian otomatis.

---

## 2. Inventaris Komponen Saat Ini

| Komponen | File | Tanggung Jawab |
| :--- | :--- | :--- |
| **Header** | `Header.jsx` | Menampilkan identitas platform TERALIO dan status indikator kesiapan teknologi (Vite, Express, Supabase, OpenAI). |
| **ItemCard** | `ItemCard.jsx` | Merender kartu item/listing ringkas dengan judul, deskripsi, dan badge kategori. |
| **OpenAiCard** | `OpenAiCard.jsx` | Antarmuka pengujian AI interaktif: input prompt teks, pemanggilan backend API, dan visualisasi respon AI. |
| **SupabaseStatus** | `SupabaseStatus.jsx` | Indikator visual status koneksi Supabase di sisi frontend (URL, keberadaan Anon Key, status konfigurasi). |

---

## 3. Peta Jalan Komponen TERALIO (Adaptive UI Roadmap)

Komponen-komponen baru yang akan ditambahkan sejalan dengan implementasi fitur utama TERALIO:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TERALIO COMPONENT ROADMAP                       │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│ Komponen Baru       │ File Target              │ Fungsi Utama          │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ VoiceLiveBar        │ VoiceLiveBar.jsx         │ Kontrol mic, status   │
│                     │                          │ WebRTC GPT-Live 1,    │
│                     │                          │ audio wave visualizer │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ PropertyCard        │ PropertyCard.jsx         │ Kartu kos: foto,      │
│                     │                          │ harga, jarak kampus,  │
│                     │                          │ kamar mandi dalam,    │
│                     │                          │ badge verifikasi      │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ PropertyComparison  │ PropertyComparison.jsx   │ Matriks komparasi     │
│                     │                          │ berdampingan (2–3 kos)│
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ PreferencePanel     │ PreferencePanel.jsx      │ Menampilkan kriteria  │
│                     │                          │ hasil ekstraksi AI    │
│                     │                          │ (budget, fasilitas)   │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ InteractiveMap      │ InteractiveMap.jsx       │ Peta radius kampus &  │
│                     │                          │ marker lokasi kos     │
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

---

## 4. Panduan Clean Code Penulisan Komponen Baru

Contoh struktur komponen yang dianjurkan:

```jsx
import React from 'react';

/**
 * PropertyCard
 * Menampilkan ringkasan informasi kos hasil rekomendasi TERALIO.
 * 
 * @param {Object} props
 * @param {Object} props.property - Data properti
 * @param {Function} [props.onSelect] - Callback saat kartu diklik
 */
export const PropertyCard = ({ property, onSelect }) => {
  if (!property) return null;

  const { id, title, price, distanceToCampus, privateBathroom, isVerified } = property;

  return (
    <article className="property-card" data-testid={`property-card-${id}`}>
      {/* 1. Header & Badges */}
      <div className="property-card-header">
        <span className="price-tag">Rp{Number(price).toLocaleString('id-ID')}/bln</span>
        {isVerified && <span className="verified-badge">Terverifikasi</span>}
      </div>

      {/* 2. Informasi Utama */}
      <h4>{title}</h4>
      <p className="property-distance">📍 {distanceToCampus}m dari kampus</p>
      
      {/* 3. Fasilitas Kunci */}
      <div className="amenity-badges">
        {privateBathroom && <span>Kamar Mandi Dalam</span>}
      </div>

      {/* 4. Aksi */}
      {onSelect && (
        <button className="btn btn-secondary" onClick={() => onSelect(property)}>
          Lihat Detail
        </button>
      )}
    </article>
  );
};

export default PropertyCard;
```

### Aturan Wajib:
- ❌ **Dilarang**: Melakukan fetch API langsung di dalam komponen presentational (misal di dalam `PropertyCard`). Fetch API dilakukan di tingkat service atau container `pages/`.
- ❌ **Dilarang**: Menyimpan state duplikat yang sudah tersedia di props.
- ✅ **Wajib**: Menggunakan penamaan berkas `PascalCase.jsx`.
- ✅ **Wajib**: Menyediakan unit test di `frontend/tests/` untuk setiap komponen baru.
