# TERALIO
> **TECHNOLOGY-ENABLED REAL-TIME ACCOMMODATION & LIFESTYLE INTELLIGENCE ORCHESTRATOR**  
> *"Find your place through conversation."*  
> **AI-Powered Accommodation Discovery Platform**

---

## 1. Visi & Identitas Produk

**TERALIO** bukanlah chatbot sederhana atau voice bot yang ditempelkan di atas marketplace properti konvensional. TERALIO adalah **AI-first accommodation discovery platform** yang mengubah proses pencarian hunian mahasiswa dari pengisian filter manual yang kaku menjadi **pengalaman percakapan dua arah yang cerdas, kontekstual, dan adaptif**.

Pengguna tidak perlu lagi menerjemahkan kebutuhan personal, keterbatasan finansial, maupun gaya hidup mereka ke dalam puluhan dropdown filter. Pengguna cukup bercerita secara alami—melalui suara maupun teks—dan TERALIO akan memahami konteks, mengekstrak preferensi, menjalankan pencarian berbasis alat (*tools*), melakukan pemeringkatan berbasis data valid, serta secara bersamaan memperbarui antarmuka pengguna (*Adaptive Interface*) secara dinamis.

---

## 2. Tiga Pilar Fondasi Produk

```
┌────────────────────────────────────────────────────────────────────────┐
│                          TERALIO ARCHITECTURE                          │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│ 1. Voice            │ 2. Agent                 │ 3. Adaptive           │
│    Intelligence     │    Intelligence          │    Interface          │
│                     │                          │                       │
│ • GPT-Live 1        │ • OpenAI Responses API   │ • React + Vite        │
│ • Full-Duplex Voice │ • Context Understanding  │ • Dynamic Listing     │
│ • WebRTC Transport  │ • MCP Remote Tools       │ • Interactive Map     │
│ • Interruption Mgmt │ • Hybrid Recommendation  │ • Realtime Sync (SSE) │
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

1. **Voice Intelligence**:
   - Kemampuan AI berkomunikasi secara natural melalui percakapan suara dua arah secara *real-time* (*full-duplex*).
   - Menggunakan model **OpenAI GPT-Live 1** melalui koneksi **WebRTC** yang aman.
   - Mendukung interupsi langsung dari pengguna serta delegasi tugas ke *backend* tanpa memutus alur percakapan suara.

2. **Agent Intelligence**:
   - Kemampuan AI memahami konteks implisit pengguna, mengambil keputusan pencarian, serta memanggil kapabilitas *backend* melalui **MCP (Model Context Protocol)**.
   - Bertanggung jawab mengubah bahasa alami menjadi data preferensi terstruktur tanpa mengambil alih kalkulasi matematika atau manipulasi data mentah.

3. **Adaptive Interface**:
   - Antarmuka web modern yang merespons jalannya percakapan secara visual dan *real-time*.
   - Saat pengguna berdiskusi, kartu properti, perbandingan fasilitas, peta interaktif, dan status pencarian diperbarui otomatis tanpa *page reload*.

---

## 3. Masalah yang Diselesaikan & Target Pengguna

### Target Pengguna Utama (Fase Awal):
- **Mahasiswa Baru**: Belum memahami medan/lingkungan sekitar kampus, rute transportasi, dan standar harga kos lokal.
- **Mahasiswa Pindah Kos**: Memiliki preferensi spesifik berdasarkan pengalaman sebelumnya (misal: mencari kos yang lebih tenang atau jam malam fleksibel).
- **Mahasiswa dengan Anggaran Terbatas**: Membutuhkan optimasi antara jarak ke kampus dan harga sewa.
- **Mahasiswa dengan Kebutuhan Khusus**: Menuntut fasilitas wajib (kamar mandi dalam, Wi-Fi berkecepatan tinggi untuk jurusan teknik/desain, parkir mobil, lingkungan ramah belajar).

### Nilai Tambah vs Sistem Konvensional:
| Aspek | Sistem Listing Konvensional | TERALIO Conversational Discovery |
| :--- | :--- | :--- |
| **Input Pengguna** | Form dropdown kaku (lokasi, rentang harga, checkbox fasilitas). | Cerita natural ("Aku kuliah di Telkom University, budget 1,5 jt, butuh Wi-Fi stabil buat tugas"). |
| **Pemahaman Konteks** | Hanya mencocokkan kata kunci dasar (*strict keyword matching*). | Membedakan syarat wajib (*hard constraints*) dan preferensi prioritas (*soft preferences*). |
| **Pencarian Lanjutan** | Reset filter atau ganti filter satu per satu secara manual. | Percakapan berkelanjutan ("Coba cari yang lebih dekat kampus", "Naikkan budget sampai 1,7 jt"). |
| **Eksplanasi Hasil** | Daftar tanpa alasan kontekstual. | AI menjelaskan secara faktual mengapa properti A direkomendasikan dibanding properti B. |

---

## 4. Hybrid Recommendation Engine

Prinsip penting dalam TERALIO: **Jangan menyerahkan seluruh keputusan dan filter data kepada LLM.** TERALIO menggunakan arsitektur *Hybrid Recommendation 4-Tahap*:

```
[ Natural Voice / Text ]
          │
          ▼
┌─────────────────────────────────┐
│ 1. Preference Extraction        │  --> LLM mengekstrak: budget, location, required_facilities
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 2. Hard Filtering (Backend)     │  --> SQL/PostGIS: price <= max, status == 'available', distance <= max
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 3. Preference Ranking (Backend) │  --> Algoritma Terbobot: Distance(35%) + Price(30%) + Amenities(25%) + Env(10%)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ 4. Grounded Explanation (LLM)   │  --> AI menjelaskan hasil rekomendasi berdasarkan data aktual yang lolos ranking
└─────────────────────────────────┘
```

1. **Tahap 1 - Preference Extraction**: AI mengubah dialog alami menjadi payload JSON terstruktur.
2. **Tahap 2 - Hard Filtering**: Express backend menyaring database secara deterministik (harga maksimal, ketersediaan, wilayah).
3. **Tahap 3 - Preference Ranking**: Backend menghitung skor kecocokan berdasarkan matriks bobot preferensi pengguna.
4. **Tahap 4 - Grounded Explanation**: AI menyusun penjelasan suara/teks berdasarkan alasan faktual mengapa properti tersebut direkomendasikan.

---

## 5. Model Context Protocol (MCP) Tools

Agen AI TERALIO mengakses kapabilitas sistem menggunakan remote MCP tools:

| Nama Tool | Fungsi Utama |
| :--- | :--- |
| `search_accommodations` | Mencari daftar kos berdasarkan kriteria lokasi, budget, dan fasilitas |
| `get_accommodation_details` | Mengambil detail spesifik properti (ukuran kamar, aturan, foto, jarak kampus) |
| `compare_accommodations` | Menghasilkan matriks komparasi dari 2–3 properti terpilih |
| `find_nearby_facilities` | Menemukan fasilitas penunjang di sekitar kos (laundry, minimarket, warung makan, halte) |
| `refine_recommendations` | Memperbarui hasil rekomendasi dengan preferensi baru dari percakapan lanjutan |
| `save_favorite` | Menyimpan properti ke daftar favorit pengguna |

---

## 6. Prinsip Clean Code & Standar Arsitektur

Untuk menjaga agar codebase tetap terstruktur dan mudah diskalakan:
1. **Single Responsibility Principle (SRP)**: Setiap modul, berkas, komponen, dan service hanya memiliki satu tanggung jawab spesifik.
2. **Layered Architecture**: Pemisahan tegas antara lapis Presentasi (`frontend/`, `backend/api/`), Domain Bisnis (`backend/services/`), dan Skema Data (`backend/models/`).
3. **Deterministic Business Logic**: Seluruh validasi harga, filter lokasi, dan penghitungan skor ranking dijalankan oleh backend, bukan oleh halusinasi LLM.
4. **Stateless Backend Design**: Backend Express dirancang stateless agar siap dijalankan sebagai daemon lokal maupun Vercel Serverless Function (`api/index.js`).
5. **Fail-Safe & Graceful Degradation**: Kegagalan koneksi eksternal (OpenAI / Supabase) memiliki mekanisme penanganan fallback yang informatif tanpa mematikan aplikasi.

---

## 7. Peta Navigasi Dokumentasi Codebase

Setiap folder memiliki dokumentasi arsitektur spesifik:

```text
TERALIO/
├── frontend/                     --> [README.md](frontend/README.md) - Arsitektur UI & Voice Client
│   ├── components/               --> [README.md](frontend/components/README.md) - Katalog Komponen UI Modular
│   ├── pages/                    --> [README.md](frontend/pages/README.md) - Orkes Tampilan & Discovery Workspace
│   └── styles/                   --> [README.md](frontend/styles/README.md) - Design Tokens & Desain SaaS Modern
├── backend/                      --> [README.md](backend/README.md) - Arsitektur Server, MCP & Recommendation
│   ├── api/                      --> [README.md](backend/api/README.md) - HTTP Routing, Controller & WebRTC
│   ├── services/                 --> [README.md](backend/services/README.md) - Logika Bisnis, OpenAI, Supabase & MCP
│   └── models/                   --> [README.md](backend/models/README.md) - Data Schema, Entities & Validasi
├── docs/                         --> [README.md](docs/README.md) - Master Dokumentasi Teknis
│   ├── ARCHITECTURE.md           --> Arsitektur Sistem Menyeluruh
│   ├── API_SPEC.md               --> Kontrak Spesifikasi REST API
│   ├── SUPABASE_SETUP.md         --> Panduan Skema PostgreSQL & RLS
│   └── VERCEL_DEPLOYMENT.md      --> Panduan Deployment Vercel Serverless
├── api/index.js                  --> Vercel Serverless Function Wrapper
├── vercel.json                   --> Konfigurasi Routing Rewrite Vercel
└── package.json                  --> Konfigurasi NPM Workspaces Monorepo
```

---

## 8. Menjalankan Project

### Instalasi Dependensi
```bash
npm install
```

### Menjalankan Automated Tests
```bash
npm test
```

### Menjalankan Server Lokal
```bash
# Terminal 1: Backend Express (Port 5000)
npm run dev:backend

# Terminal 2: Frontend Vite (Port 3000)
npm run dev:frontend
```

### Deployment ke Vercel
Project ini telah dilengkapi dengan `vercel.json` dan `api/index.js` yang siap dideploy tanpa kendala CORS. Baca [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md).
