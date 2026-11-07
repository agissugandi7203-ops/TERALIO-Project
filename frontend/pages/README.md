# Pages - TERALIO Workspace Orchestration

Direktori `frontend/pages/` menampung tampilan tingkat atas (*container views*) yang bertanggung jawab mengorkestrasi state aplikasi, komunikasi jaringan (REST API, WebRTC, SSE), serta menyusun komponen-komponen UI modular menjadi alur kerja yang terpadu.

---

## 1. Konsep Tampilan TERALIO: 3 Area Kerja Utama

Berdasarkan visi produk TERALIO, tampilan utama bukanlah halaman formulir pencarian statis ataupun antarmuka chatbox biasa, melainkan **Discovery Workspace Modern** dengan 3 area fungsional:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TERALIO MAIN WORKSPACE                          │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│ AREA 1:             │ AREA 2:                  │ AREA 3:               │
│ Discovery Workspace │ AI Conversation          │ Contextual Panel      │
│                     │                          │                       │
│ • Rekomendasi Kos   │ • Tombol Mic & WebRTC    │ • Preferensi Aktif    │
│ • Kartu Listing     │ • Status Suara (Live)    │ • Peta Radius Kampus  │
│ • Detail & Foto     │ • Transkrip Percakapan   │ • Filter Manual       │
│ • Matriks Komparasi │ • Fallback Teks          │ • Quick Shortcuts     │
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

1. **Area 1: Discovery Workspace**:
   - Menampilkan hasil pencarian hunian aktual dalam bentuk kartu dinamis.
   - Menyediakan modal detail kamar, foto fasilitas, dan perbandingan 2–3 pilihan terbaik.
2. **Area 2: AI Conversation Interface**:
   - Tempat pengguna berinteraksi langsung dengan AI Agent.
   - Memiliki kontrol suara (*voice controls*), visualisasi gelombang suara (*audio waveform*), status agen (Mendengarkan, Mencari Listing, Berbicara), dan transkrip teks percakapan.
3. **Area 3: Contextual Information Panel**:
   - Menampilkan data yang telah dipahami oleh AI (misal: "Budget: Maks 1,5 jt", "Wajib: Kamar Mandi Dalam", "Prioritas: Jarak Dekat").
   - Pengguna dapat mengoreksi atau mengubah preferensi ini secara manual tanpa harus mengulang percakapan.

---

## 2. Berkas Halaman Saat Ini

- **`HomePage.jsx`**:
  - Halaman beranda yang berfungsi sebagai dashboard status terintegrasi dan demonstrasi awal kapabilitas TERALIO.
  - Memeriksa konektivitas backend Express (`GET /api/health`), menampilkan status Supabase (`SupabaseStatus.jsx`), menyediakan pengujian interaktif OpenAI (`OpenAiCard.jsx`), dan memuat daftar item/listing kos (`/api/items`).

---

## 3. Prinsip Clean Code pada Pages

Untuk mencegah `pages/` menjadi modul "god object" yang terlalu besar:

1. **Kompensasi Logika Bisnis ke Custom Hooks**:
   - Jika terdapat logika komunikasi yang kompleks (seperti koneksi WebRTC atau pengelolaan stream audio), buat custom hook terpisah (misal: `useGptLiveSession.js` atau `usePropertySearch.js`).
2. **Pola Container / View Controller**:
   - Halaman bertindak sebagai pengendali data: mengambil data dari API, mengelola state loading dan error, lalu meneruskannya sebagai props ke komponen anak di `components/`.
3. **Lifecycle Management yang Bersih**:
   - Efek samping (`useEffect`) harus memiliki daftar dependensi yang eksplisit.
   - Sediakan fungsi *cleanup* (misal: menutup koneksi WebRTC atau membatalkan abort controller fetch) saat halaman di-unmount.
4. **Error Boundaries & Skeleton Loading**:
   - Jangan biarkan halaman putih (*white screen*) saat terjadi kegagalan jaringan; tampilkan visualisasi fallback yang informatif dan tombol untuk mencoba kembali (*retry button*).
