# Backend - TERALIO Orchestration Engine & MCP Server

Direktori `backend/` berfungsi sebagai mesin orkestrasi utama TERALIO: mengelola sesi suara WebRTC GPT-Live 1, menyediakan remote MCP (*Model Context Protocol*) tools, menjalankan kalkulasi *hybrid recommendation engine*, serta menjamin integritas data kos melalui PostgreSQL (Supabase).

---

## 1. Peran Backend dalam Ekosistem TERALIO

```
                                  [ Browser Client ]
                                          │
                        ┌─────────────────┴─────────────────┐
                 (WebRTC Audio)                       (HTTP / SSE)
                        │                                   │
                        ▼                                   ▼
             [ OpenAI GPT-Live 1 ]               [ Express Backend ]
                        │                                   │
                 (Responses Delegation)                     │
                        │                                   ▼
                        └─────────► [ MCP Server / Remote Tools ]
                                            ├── search_accommodations
                                            ├── get_accommodation_details
                                            ├── compare_accommodations
                                            └── find_nearby_facilities
                                                    │
                                                    ▼
                                     [ Hybrid Recommendation Engine ]
                                     (Hard Filtering + Weighted Rank)
                                                    │
                                                    ▼
                                         [ PostgreSQL / Supabase ]
```

Backend TERALIO memiliki 4 pilar tanggung jawab:
1. **Sesi WebRTC & Autentikasi Suara**: Menghubungkan browser dengan endpoint `https://api.openai.com/v1/live/sessions` secara aman tanpa mengekspos API key rahasia ke klien.
2. **MCP Tool Provider**: Menyediakan endpoint fungsi terstandarisasi yang dipanggil oleh AI Agent saat melakukan pencarian properti.
3. **Hybrid Recommendation Engine**: Memproses hard-filtering matematis (harga, jarak kampus, status ketersediaan) dan menghitung skor relevansi terbobot.
4. **Data Layer Protection**: Memvalidasi seluruh payload masukan pengguna menggunakan skema data model sebelum berinteraksi dengan database.

---

## 2. Prinsip Clean Code pada Backend (Layered Architecture)

Untuk menjaga agar backend tetap modular dan mudah diuji, arsitektur dibagi menjadi 3 lapis independen:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Presentation Layer (api/)                                │
│    • Routing URL (/api/health, /api/items, /api/openai)     │
│    • Controller thin-layer: Validasi request & format JSON  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Domain / Service Layer (services/)                       │
│    • Logika bisnis pencarian & ranking rekomendasi          │
│    • Komunikasi eksternal: OpenAI SDK & Supabase Client     │
│    • Penanganan fallback & state simulasi development       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Data / Model Layer (models/)                             │
│    • Definisi entitas data (ItemModel, AccommodationEntity) │
│    • Schema validator runtime murni tanpa dependensi luar   │
└─────────────────────────────────────────────────────────────┘
```

### Aturan Arsitektur Wajib:
- **Thin Controllers**: Controller di `api/` tidak boleh memuat query database atau rumus matematika ranking; controller hanya mengurai `req.body`/`req.params`, memanggil `service`, dan mengembalikan `res.status().json()`.
- **Pure Business Logic in Services**: Rumus bobot rekomendasi, pemanggilan Supabase, dan interaksi OpenAI hanya berada di `services/`.
- **Dependency Inversion**: Service menerima dependensi (atau menyediakan mock reset) agar mudah diuji secara otomatis (*automated testing*).
- **Stateless Server**: Server tidak menyimpan session state di memori lokal permanen agar dapat berjalan tanpa kendala pada platform serverless seperti Vercel.

---

## 3. Struktur Direktori Backend

```text
backend/
├── api/                 --> HTTP Routers, Controllers, dan Handler WebRTC
│   └── README.md        --> Panduan Clean Code API
├── services/            --> Layanan Bisnis, MCP Tools, OpenAI & Supabase
│   └── README.md        --> Panduan Arsitektur Services & Recommendation
├── models/              --> Schema Validator & Entity Data Models
│   └── README.md        --> Panduan Model Domain & Validasi
├── tests/               --> Automated Integration & Unit Tests (Vitest + Supertest)
│   ├── api.test.js      --> Test suite untuk seluruh rute API
│   └── services.test.js --> Test suite untuk validasi data model & helper
├── app.js               --> Inisialisasi Express app, middleware CORS & error handler
├── server.js            --> Entrypoint listener lokal (http://localhost:5000)
├── .env.example         --> Contoh kredensial Supabase & OpenAI
└── package.json         --> Konfigurasi dependensi backend
```

---

## 4. Pengujian Otomatis (*Automated Testing*)

Seluruh rute dan logika backend diuji menggunakan Vitest dan Supertest tanpa perlu membuka port jaringan fisik:

```bash
# Jalankan test backend
npm test --prefix backend
```

Test mencakup:
- Health check & uptime
- Integrasi status Supabase & fallback
- Endpoint OpenAI status dan simulasi chat
- Operasi CRUD item/listing dan validasi penolakan error 400 Bad Request
- Penanganan rute 404 Not Found
