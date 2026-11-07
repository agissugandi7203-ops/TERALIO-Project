# Dokumentasi Teknis TERALIO

Direktori `docs/` memuat dokumentasi arsitektur menyeluruh, spesifikasi antarmuka API, panduan database Supabase, serta instruksi deployment serverless pada Vercel.

---

## Indeks Dokumentasi

1. **[ARCHITECTURE.md](ARCHITECTURE.md) - Arsitektur Sistem Menyeluruh**
   - Diagram alur data dari browser pengguna, transport WebRTC GPT-Live 1, integrasi MCP tools, hingga kalkulasi hybrid recommendation di Express dan PostgreSQL Supabase.
   - Penjelasan 3 pilar: Voice Intelligence, Agent Intelligence, dan Adaptive Interface.

2. **[API_SPEC.md](API_SPEC.md) - Spesifikasi Kontrak REST API**
   - Rincian endpoint HTTP: `/api/health`, `/api/supabase-status`, `/api/items`, dan `/api/openai/status`.
   - Format payload request dan standarisasi respon JSON sukses maupun error.

3. **[SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Panduan Database PostgreSQL & RLS**
   - Langkah pembuatan project Supabase.
   - Skema DDL tabel `items` / properti hunian, aktivasi Row Level Security (RLS), kebijakan izin SELECT/INSERT, dan seed data awal.

4. **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Panduan Deployment ke Vercel**
   - Konfigurasi `vercel.json` dan `api/index.js` (Serverless Function).
   - Penanganan routing SPA Vite dan Express backend tanpa kendala CORS.
   - Panduan pengisian Environment Variables di dashboard Vercel.
