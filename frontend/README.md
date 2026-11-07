# Frontend - TERALIO Adaptive Interface & Voice Client

Direktori `frontend/` bertanggung jawab atas seluruh pengalaman pengguna (*User Experience*) TERALIO: antarmuka pencarian adaptif, visualisasi listing properti, kontrol percakapan suara WebRTC (*full-duplex*), peta interaktif, serta sinkronisasi hasil rekomendasi secara *real-time*.

---

## 1. Peran Frontend dalam Ekosistem TERALIO

Frontend TERALIO dirancang bukan sebagai katalog listing pasif, melainkan sebagai **Adaptive User Interface** yang merespons jalannya percakapan suara maupun teks:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TERALIO FRONTEND CLIENT                         │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│ 1. Voice Interface  │ 2. Discovery Workspace   │ 3. Contextual Sidebar │
│                     │                          │                       │
│ • WebRTC Audio Mic  │ • Dynamic Listing Cards  │ • Extracted Prefs     │
│ • GPT-Live Status   │ • Comparison Matrix      │ • Campus Map Marker   │
│ • Live Transcript   │ • Detail Modal / Drawer  │ • Manual Overrides    │
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

1. **Voice Conversation Stream**: Menangkap audio microphone pengguna, membuat SDP offer WebRTC ke backend Express, dan menerima streaming audio langsung dari OpenAI GPT-Live 1.
2. **Dynamic Listing Display**: Menampilkan kartu hunian yang diperbarui secara otomatis ketika Agent menyelesaikan pencarian via MCP tools.
3. **Multimodal Fallback**: Pengguna tidak dipaksa hanya menggunakan suara; pengguna dapat mengetik via text prompt, mengubah filter manual di sidebar, atau mengklik pin peta kapan saja.

---

## 2. Prinsip Clean Code pada Frontend

Sebelum codebase berkembang lebih besar, setiap modul frontend wajib mematuhi standar berikut:

### A. Component-Driven Architecture & Atomic Responsibility
- **Presentational vs Container Components**: Pisahkan komponen murni visual (di `components/`) dari komponen pengelola state dan routing (di `pages/`).
- **Single Responsibility**: Satu komponen hanya bertanggung jawab atas satu elemen tampilan (misal: `ItemCard` hanya menampilkan ringkasan hunian, bukan mengurus fetch API).
- **Explicit Props Contract**: Selalu sediakan nilai default (*default props*) dan penanganan `null`/`undefined` untuk mencegah runtime crash saat data masih dimuat.

### B. Unidirectional Data Flow & State Isolation
- State global atau sesi suara diisolasi pada tingkat atas halaman (`pages/HomePage.jsx`).
- State lokal komponen (seperti input teks atau status hover) disimpan di dalam komponen itu sendiri tanpa mencemari state aplikasi.

### C. Graceful Degradation & User Feedback
- Saat AI sedang berpikir atau backend sedang melakukan filtering, antarmuka wajib menampilkan indikator visual (*skeleton loaders* atau status bar) agar pengguna tidak merasa aplikasi macet.
- Semua aksi asinkronus (fetch API, WebRTC connection) memiliki penanganan error yang ramah pengguna.

---

## 3. Struktur Direktori Frontend

```text
frontend/
├── components/          --> Komponen UI modular (Header, Cards, VoiceBar, Status)
│   └── README.md        --> Panduan Clean Code Komponen
├── pages/               --> Halaman utama & container orkestrasi tampilan
│   └── README.md        --> Panduan Arsitektur Workspace Halaman
├── styles/              --> Design tokens, reset CSS, dan tema visual SaaS
│   └── README.md        --> Panduan Styling & Design System
├── tests/               --> Unit & component tests menggunakan Vitest + Testing Library
├── App.jsx              --> Root layout wrapper & semantic shell
├── main.jsx             --> React 18 DOM mount entrypoint
├── index.html           --> Vite HTML shell & favicon
├── supabaseClient.js    --> Inisialisasi Supabase JS Client untuk direct auth / public read
├── vite.config.js       --> Konfigurasi bundler Vite, path aliases (@components, @pages), & dev proxy
├── vitest.config.js     --> Konfigurasi test environment (jsdom)
└── vercel.json          --> Konfigurasi rewrite SPA khusus Vercel
```

---

## 4. Alur Integrasi WebRTC Audio (Voice Intelligence)

1. **User Action**: Pengguna menekan tombol "Mulai Bicara" pada `VoiceLiveBar`.
2. **Offer Creation**: Browser meminta izin `navigator.mediaDevices.getUserMedia({ audio: true })` dan membuat WebRTC `RTCPeerConnection`.
3. **Session Handshake**: Frontend mengirimkan SDP offer ke endpoint backend Express (`POST /api/live/session`).
4. **Answer Received**: Backend mereturn SDP answer dari OpenAI Live API; koneksi audio P2P terbentuk.
5. **UI Synchronization**: Event data yang dikirim oleh backend melalui SSE / WebSocket akan memicu pembaruan state pada `pages/HomePage.jsx`.

---

## 5. Pengujian & Standar Verifikasi

Frontend telah dilengkapi unit test dengan Vitest dan `@testing-library/react`.

Jalankan test frontend:
```bash
npm run test:frontend
```

Jalankan production build test:
```bash
npm run build:frontend
```
Setiap perubahan komponen harus dipastikan lolos test dan build tanpa peringatan modul tak terpakai.
