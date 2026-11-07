# Konfigurasi Environment Variables & Keamanan

Dokumen ini memuat referensi lengkap seluruh variabel environment pada TERALIO beserta cara penyiapannya untuk development lokal maupun deployment produksi (Vercel / Node.js server).

---

## 1. Langkah Cepat Persiapan Lokal

1. Salin template environment backend:
   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```
2. Isi credential aktif Anda pada `backend/.env` (berkas `.env` sudah masuk di `.gitignore` dan tidak akan ter-commit ke Git).
3. Periksa status pembacaan seluruh integrasi melalui:
   ```powershell
   npm run dev:backend
   # Buka http://localhost:5000/api/integrations/status
   ```

---

## 2. Daftar Lengkap Variabel Backend (`backend/.env`)

Seluruh variabel di bawah ini dibaca terpusat oleh [`backend/config/env.js`](../backend/config/env.js).

### A. Server & Keamanan HTTP
| Variabel | Default | Wajib di Prod? | Keterangan |
| :--- | :--- | :---: | :--- |
| `PORT` | `5000` | Tidak | Port HTTP server Express lokal |
| `NODE_ENV` | `development` | Ya (`production`) | Mengaktifkan validasi CORS ketat & kewajiban `MCP_SERVER_AUTH_TOKEN` |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Ya | Daftar origin frontend yang diizinkan (dipisahkan koma; pada Vercel `FRONTEND_URL` juga ditambahkan otomatis) |
| `TRUST_PROXY` | `false` (`true` otomatis di Vercel) | Opsional | Aktifkan di belakang reverse proxy agar rate-limiter membaca IP asli client |
| `HTTP_JSON_LIMIT` | `100kb` | Tidak | Batas ukuran payload JSON masuk |
| `AI_REQUIRE_AUTH` | `false` | Disarankan `true` | Jika `true`, seluruh endpoint AI/Realtime/Maps mewajibkan Bearer token sesi Supabase |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Tidak | Jendela waktu rate limiter dalam milidetik |
| `RATE_LIMIT_MAX` | `30` | Tidak | Maksimum request AI/Maps per IP per jendela waktu |
| `REALTIME_SESSION_RATE_LIMIT_MAX` | `10` | Tidak | Maksimum penerbitan sesi suara Realtime per IP per jendela waktu |

### B. Supabase
| Variabel | Default | Wajib? | Keterangan |
| :--- | :--- | :---: | :--- |
| `SUPABASE_URL` | — | Ya (untuk DB nyata) | URL project Supabase (`https://<id>.supabase.co`) |
| `SUPABASE_ANON_KEY` | — | Ya | Public anon key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Ya (server-only) | Secret key administratif backend — **jangan pernah taruh di frontend** |

### C. OpenAI Responses, Web Search & Realtime Voice
| Variabel | Default | Wajib? | Keterangan |
| :--- | :--- | :---: | :--- |
| `OPENAI_API_KEY` | — | **Ya** | Kunci utama OpenAI (`sk-...`) — hanya disimpan di backend |
| `OPENAI_ORG_ID` | kosong | Opsional | ID organisasi OpenAI |
| `OPENAI_PROJECT_ID` | kosong | Opsional | ID project OpenAI |
| `OPENAI_TIMEOUT_MS` | `30000` | Tidak | Batas waktu request ke OpenAI (ms) |
| `OPENAI_MAX_RETRIES` | `2` | Tidak | Jumlah percobaan ulang otomatis SDK OpenAI |
| `OPENAI_TEXT_MODEL` | `gpt-6-astra` | Tidak | Model utama Responses API & orkestrasi tools |
| `OPENAI_TEXT_REASONING_EFFORT` | `low` | Tidak | Tingkat penalaran (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) |
| `OPENAI_AGENT_MAX_TOOL_ROUNDS` | `5` | Tidak | Batas putaran eksekusi tools dalam 1 giliran percakapan |
| `OPENAI_WEB_SEARCH_MODEL` | mengikuti `OPENAI_TEXT_MODEL` | Tidak | Model untuk pencarian web |
| `OPENAI_WEB_SEARCH_CONTEXT_SIZE` | `medium` | Tidak | Kedalaman konteks hasil web (`low`, `medium`, `high`) |
| `OPENAI_WEB_SEARCH_COUNTRY` | `ID` | Tidak | Kode negara ISO 2 huruf untuk lokalisasi pencarian web |
| `OPENAI_WEB_SEARCH_CITY` | kosong | Opsional | Nama kota default pencarian web (misal `Bandung`) |
| `OPENAI_WEB_SEARCH_TIMEZONE` | `Asia/Jakarta` | Tidak | Zona waktu IANA pencarian web |
| `OPENAI_WEB_SEARCH_ALLOWED_DOMAINS` | kosong | Opsional | Daftar domain terfilter dipisahkan koma (maks 100) |
| `OPENAI_REALTIME_MODEL` | `gpt-realtime-2.1` | Tidak | Model suara Realtime GA (`gpt-realtime-2.1` atau `gpt-realtime-2.1-mini`) |
| `OPENAI_REALTIME_VOICE` | `marin` | Tidak | Suara asisten (`marin`, `cedar`, `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`) |
| `OPENAI_REALTIME_REASONING_EFFORT` | `low` | Tidak | Tingkat penalaran model suara Realtime |
| `OPENAI_REALTIME_TRANSCRIPTION_MODEL` | `gpt-transcribe` | Tidak | Model transkripsi input mikrofon pengguna |
| `OPENAI_REALTIME_TRANSCRIPTION_LANGUAGE` | `id` | Tidak | Bahasa input suara (ISO-639-1) |
| `OPENAI_REALTIME_VAD_EAGERNESS` | `auto` | Tidak | Sensitivitas `semantic_vad` (`low`, `medium`, `high`, `auto`) |
| `OPENAI_REALTIME_TOKEN_TTL_SECONDS` | `600` | Tidak | Masa berlaku ephemeral client secret (`10`–`7200` detik) |
| `OPENAI_REALTIME_MAX_OUTPUT_TOKENS` | `'inf'` | Opsional | Batas token respons suara per giliran (`1`–`4096` atau kosong untuk `inf`) |

### D. Model Context Protocol (MCP)
| Variabel | Default | Wajib di Prod? | Keterangan |
| :--- | :--- | :---: | :--- |
| `MCP_SERVER_ENABLED` | `true` | Tidak | Mengaktifkan endpoint MCP server `/api/mcp` |
| `MCP_SERVER_AUTH_TOKEN` | kosong | **Ya (di prod)** | Bearer secret yang wajib dikirim klien MCP ke `/api/mcp` |
| `TOOL_TIMEOUT_MS` | `20000` | Tidak | Batas waktu eksekusi per tool (ms) |
| `MCP_EXTERNAL_SERVERS` | kosong (`[]`) | Opsional | JSON array daftar MCP server eksternal (`backend` atau `openai_remote`) |

### E. Google Maps Platform
| Variabel | Default | Wajib? | Keterangan |
| :--- | :--- | :---: | :--- |
| `GOOGLE_MAPS_SERVER_API_KEY` | — | Ya (untuk fitur Maps) | API key server Google Maps Platform (wajib project ber-billing aktif) |
| `GOOGLE_MAPS_LANGUAGE_CODE` | `id` | Tidak | Bahasa hasil tempat & rute |
| `GOOGLE_MAPS_REGION_CODE` | `ID` | Tidak | Kode wilayah CLDR 2 huruf |
| `GOOGLE_MAPS_TIMEOUT_MS` | `10000` | Tidak | Timeout HTTP ke Google Maps (ms) |
| `GOOGLE_MAPS_MAX_RETRIES` | `2` | Tidak | Retry otomatis saat error jaringan / 429 / 5xx |
| `GOOGLE_MAPS_DETAILS_LEVEL` | `contact` | Tidak | Default field mask Place Details (`basic`, `contact`, `full`) |

---

## 3. Variabel Frontend (`frontend/.env`)

Hanya variabel publik yang aman dilihat pengguna browser yang boleh ditempatkan di `frontend/.env`:

- `VITE_SUPABASE_URL` — URL project Supabase.
- `VITE_SUPABASE_ANON_KEY` — Public anon key Supabase (diamankan oleh RLS).
- `VITE_API_URL` — Base URL backend (`http://localhost:5000` saat lokal).
- `VITE_GOOGLE_MAPS_BROWSER_API_KEY` *(opsional)* — Key khusus browser yang dibatasi ketat dengan **HTTP Referrer** dan hanya mengizinkan *Maps JavaScript API*.

---

## 4. Perlindungan Keamanan yang Diterapkan di Backend

- **Redaksi Otomatis Log & Pesan Error**: [`backend/utils/logger.js`](../backend/utils/logger.js) menyensor pola `sk-...`, `ek_...`, `AIza...`, JWT, `Bearer ...`, dan `?key=...` menjadi `[REDACTED]` sebelum dicetak ke log maupun dikembalikan oleh error handler.
- **`Cache-Control: no-store`**: Dipasang pada `/api/realtime/client-secrets`, `/api/realtime/calls`, dan `/api/auth/*` agar token sesi tidak pernah tersimpan di cache browser/CDN.
- **Timing-Safe Token Comparison**: Validasi `MCP_SERVER_AUTH_TOKEN` menggunakan `crypto.timingSafeEqual`.
- **Audit Dependency Produksi**: `npm audit --omit=dev --workspace backend` terverifikasi **0 vulnerabilities**.
