# Panduan Deployment ke Vercel (Teralio)

Platform Teralio telah dikonfigurasi secara optimal untuk dideploy ke [Vercel](https://vercel.com) dengan arsitektur serverless (Vite frontend + Express backend API di bawah satu domain tanpa CORS).

---

## 1. Konfigurasi Vercel Otomatis (`vercel.json`)

File `vercel.json` di root repository sudah dikonfigurasi:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/api",
      "destination": "/api/index.js"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Mekanisme Kerja:
1. **Frontend Static**: Vercel mengeksekusi `npm run build` yang menghasilkan bundle Vite di folder `frontend/dist`.
2. **Serverless Backend Function**: Request ke `/api/*` secara otomatis diarahkan ke `api/index.js` yang mengekspor Express `app`. Vercel Node runtime akan menangani routing Express tanpa membutuhkan server persistent.
3. **Single Page Application (SPA)**: Rute client-side dialihkan ke `/index.html` sehingga refresh halaman React tidak menimbulkan error 404.

---

## 2. Cara Deploy Melalui Dashboard Vercel

1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik **Add New Project** -> **Import Git Repository**.
3. Pilih repository: `agissugandi7203-ops/TERALIO-Project`.
4. Pada form konfigurasi:
   - **Framework Preset**: Pilih `Vite` (atau biarkan otomatis).
   - **Root Directory**: `./` (biarkan default root).
   - **Build Command**: `npm run build` (atau otomatis sesuai `vercel.json`).
   - **Output Directory**: `frontend/dist`.
5. Masukkan **Environment Variables**:
   - `SUPABASE_URL` = URL project Supabase Anda
   - `SUPABASE_ANON_KEY` = Anon public key Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = Service role secret key Supabase
   - `OPENAI_API_KEY` = API Key OpenAI (dimulai dengan `sk-...`)
   - `OPENAI_MODEL` = `gpt-4o-mini`
   - `VITE_SUPABASE_URL` = URL project Supabase
   - `VITE_SUPABASE_ANON_KEY` = Anon public key Supabase
6. Klik **Deploy**!
