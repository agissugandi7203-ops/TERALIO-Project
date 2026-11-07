# Arsitektur Proyek Himtech Fullstack

Proyek ini dibangun menggunakan arsitektur modular yang memisahkan frontend (Vite + React), backend (Node.js + Express), dan lapisan database (Supabase).

## Diagram Arsitektur

```
[ Browser / Client ]
        │
        ├─── 1. Akses UI (Vite Dev Server :3000 / Production Build)
        │       ├── components/ (Header, SupabaseStatus, ItemCard)
        │       ├── pages/ (HomePage)
        │       └── styles/ (index.css, App.css)
        │
        ├─── 2. Client-side Database Direct Query / Auth (Supabase JS Client)
        │       └── supabaseClient.js (Anon Public Key)
        │
        └─── 3. REST API Requests (/api/*)
                │ (Proxy Vite atau Direct CORS)
                ▼
        [ Express Backend Server :5000 ]
                ├── api/ (Routes & Controllers)
                ├── services/ (Business Logic & Supabase Admin Service)
                └── models/ (Data Schema & Validators)
                        │
                        ▼
                [ Supabase Cloud / Self-hosted ]
                (PostgreSQL Database, Auth, Storage)
```

## Komponen Utama

### 1. Frontend (`/frontend`)
- **Vite:** Build tool modern dengan HMR (Hot Module Replacement) super cepat.
- **React:** UI library deklaratif untuk membuat antarmuka pengguna berbasis komponen.
- **Folder Struktur:**
  - `components/`: Komponen UI modular yang dapat digunakan kembali.
  - `pages/`: Halaman atau tampilan utama aplikasi.
  - `styles/`: Berkas styling CSS terpusat.
- **Supabase Client:** Menggunakan `@supabase/supabase-js` dengan proteksi fallback kredensial.

### 2. Backend (`/backend`)
- **Express.js:** Web framework ringan dan modular untuk Node.js dengan ES Modules (`"type": "module"`).
- **Folder Struktur:**
  - `api/`: Berisi route definitions (`routes.js`) dan controller logic (`itemsController.js`).
  - `services/`: Berisi logika bisnis (`itemsService.js`) dan konektor ke Supabase (`supabaseService.js`).
  - `models/`: Berisi skema validasi dan model data (`itemModel.js`).
- **Pemisahan `app.js` dan `server.js`:** Memungkinkan testing endpoint menggunakan `supertest` tanpa perlu mengikat port jaringan sungguhan.

### 3. Database (`Supabase`)
- Menyediakan PostgreSQL database terkelola, Otentikasi Pengguna, dan Realtime subscriptions.
- Mendukung dua level akses:
  - Frontend: Menggunakan `anon key` dengan Row Level Security (RLS) diaktifkan.
  - Backend: Menggunakan `service_role key` untuk operasi administratif atau akses terverifikasi.
