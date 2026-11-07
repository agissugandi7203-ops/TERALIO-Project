# Teralio Fullstack Platform

Fullstack Modern Platform dengan **Vite (React)** di frontend, **Express.js** di backend, **Supabase** (Database PostgreSQL & Auth), dan **OpenAI** (Chat completions AI assistant).

Project ini telah diuji secara menyeluruh (*100% test passing*), mendukung eksekusi lokal mandiri, serta dioptimasi penuh untuk deployment di **Vercel** tanpa kendala CORS.

---

## 📁 Struktur Direktori

Sesuai dengan spesifikasi folder yang ditentukan:

```text
project/
├── frontend/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── ItemCard.jsx
│   │   ├── OpenAiCard.jsx
│   │   └── SupabaseStatus.jsx
│   ├── pages/
│   │   └── HomePage.jsx
│   ├── styles/
│   │   ├── App.css
│   │   └── index.css
│   ├── tests/
│   │   ├── Header.test.jsx
│   │   ├── HomePage.test.jsx
│   │   └── SupabaseClient.test.js
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.html
│   ├── supabaseClient.js
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── vercel.json
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── api/
│   │   ├── routes.js
│   │   └── itemsController.js
│   ├── services/
│   │   ├── openaiService.js
│   │   ├── supabaseService.js
│   │   └── itemsService.js
│   ├── models/
│   │   └── itemModel.js
│   ├── tests/
│   │   ├── api.test.js
│   │   └── services.test.js
│   ├── app.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── api/
│   └── index.js               # Entrypoint Vercel Serverless Function
├── docs/
│   ├── ARCHITECTURE.md        # Diagram dan penjelasan arsitektur sistem
│   ├── API_SPEC.md            # Dokumentasi lengkap endpoint REST API
│   ├── SUPABASE_SETUP.md      # Panduan setup akun Supabase, skema SQL & RLS
│   └── VERCEL_DEPLOYMENT.md   # Panduan deployment ke Vercel tanpa kendala
├── vercel.json                # Konfigurasi routing rewrite & build Vercel
├── package.json               # Script orkestrator npm workspaces
├── .gitignore
└── README.md
```

---

## 🚀 Persiapan dan Instalasi

### 1. Install Dependencies
Jalankan perintah ini di root folder:

```bash
npm install
```

NPM workspaces akan otomatis menginstal seluruh dependensi untuk frontend dan backend sekaligus.

---

## ⚡ Menjalankan Server Development

### 1. Jalankan Backend (Express):
```bash
npm run dev:backend
# Berjalan di http://localhost:5000
```
- Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- Supabase Status: [http://localhost:5000/api/supabase-status](http://localhost:5000/api/supabase-status)
- OpenAI Status: [http://localhost:5000/api/openai/status](http://localhost:5000/api/openai/status)

### 2. Jalankan Frontend (Vite):
```bash
npm run dev:frontend
# Berjalan di http://localhost:3000 (otomatis memproxy /api ke :5000)
```

---

## 🧪 Menjalankan Automated Tests

Seluruh pengujian unit dan integrasi untuk frontend dan backend:

```bash
npm test
```

- **Test Backend:** `npm run test:backend` (menguji routes, controller, Supertest HTTP responses, model validation, Supabase helper, dan OpenAI service)
- **Test Frontend:** `npm run test:frontend` (menguji rendering komponen React, Supabase client initialization, mock fetching)
- **Build Frontend:** `npm run build` (memverifikasi Vite production bundle sukses)

---

## ☁️ Deployment ke Vercel

Project ini siap dideploy langsung ke Vercel:
1. Hubungkan repository GitHub ini: `https://github.com/agissugandi7203-ops/TERALIO-Project`.
2. Vercel akan otomatis mengenali konfigurasi `vercel.json` dan `api/index.js`.
3. Masukkan Environment Variables (`SUPABASE_URL`, `OPENAI_API_KEY`, dsb.) pada Project Settings di Vercel.
4. Panduan lengkap tersedia di [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md).

---

## 📖 Dokumentasi Lengkap
- [Arsitektur Sistem](docs/ARCHITECTURE.md)
- [Spesifikasi REST API](docs/API_SPEC.md)
- [Panduan Setup Supabase](docs/SUPABASE_SETUP.md)
- [Panduan Deployment Vercel](docs/VERCEL_DEPLOYMENT.md)
