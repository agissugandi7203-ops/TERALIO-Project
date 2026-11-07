# Pengujian & Hasil Validasi Backend TERALIO

Dokumen ini mencatat skenario pengujian yang telah dijalankan, hasil validasi aktual, serta langkah verifikasi lanjutan begitu credential eksternal aktif dimasukkan.

---

## 1. Perintah Menjalankan Pengujian

```powershell
# Menjalankan seluruh suite pengujian backend (Vitest + Supertest + Live HTTP MCP)
npm run test:backend

# Memeriksa kerentanan dependency produksi backend
npm audit --omit=dev --workspace backend
```

---

## 2. Ringkasan Hasil Automated Test Suite (`54/54` Lulus)

Seluruh **7 berkas pengujian (54 test cases)** di `backend/tests/` berhasil dijalankan dan lulus 100%:

| Suite Pengujian | Jumlah Test | Cakupan Validasi | Status |
| :--- | :---: | :--- | :---: |
| [`backend/tests/services.test.js`](../backend/tests/services.test.js) | 6 | Validasi `ItemModel`, konversi row database, inisialisasi aman Supabase client | ✅ Lulus |
| [`backend/tests/api.test.js`](../backend/tests/api.test.js) | 11 | `/api/health`, `/api/supabase-status`, CRUD `/api/items`, kompatibilitas `/api/openai/status` & `/api/openai/chat`, 404 handler | ✅ Lulus |
| [`backend/tests/auth.test.js`](../backend/tests/auth.test.js) | 16 | Registrasi, login, Google OAuth URL, forgot/reset password, `/api/auth/me`, logout | ✅ Lulus |
| [`backend/tests/openai-websearch.test.js`](../backend/tests/openai-websearch.test.js) | 5 | `/api/integrations/status`, status `503 OPENAI_NOT_CONFIGURED` saat key kosong, multi-round agentic loop `POST /api/openai/responses` (`function_call` -> eksekusi `itemsService` -> `function_call_output` + `previous_response_id`), ekstraksi sitasi & sumber `POST /api/openai/web-search`, normalisasi domain & `user_location` | ✅ Lulus |
| [`backend/tests/realtime-webrtc.test.js`](../backend/tests/realtime-webrtc.test.js) | 6 | Validasi sesi GA `gpt-realtime-2.1` (`output_modalities: ['audio']`, `semantic_vad`, `gpt-transcribe`), penolakan model deprecated, penerbitan ephemeral secret `POST /api/realtime/client-secrets` (`Cache-Control: no-store`), pertukaran SDP WebRTC `POST /api/realtime/calls` (mode `application/sdp` & JSON + ekstraksi `callId`), hangup call, dan relay eksekusi tool `POST /api/realtime/tool-call` | ✅ Lulus |
| [`backend/tests/mcp-orchestration.test.js`](../backend/tests/mcp-orchestration.test.js) | 4 | Koneksi **real HTTP** `Client` + `StreamableHTTPClientTransport` ke `/api/mcp` (`initialize`, `tools/list`, `tools/call`), kepatuhan `405` pada `GET /api/mcp`, autentikasi Bearer `MCP_SERVER_AUTH_TOKEN` (`401` vs `200`), penemuan & pemanggilan external MCP server (`mcp__campus_hub__*`) di dalam loop percakapan Responses API | ✅ Lulus |
| [`backend/tests/maps-security.test.js`](../backend/tests/maps-security.test.js) | 6 | Status `503 GOOGLE_MAPS_NOT_CONFIGURED`, Places Text Search + `X-Goog-FieldMask`, pemilihan SKU Place Details (`basic`/`contact`/`full`), deteksi billing belum aktif (`402 GOOGLE_MAPS_BILLING_REQUIRED`), perhitungan rute `WALK` (`Compute Routes Essentials`), redaksi token rahasia, penanganan JSON rusak (`400 INVALID_JSON`), dan penegakan `AI_REQUIRE_AUTH=true` (`401 AUTH_REQUIRED`) | ✅ Lulus |

---

## 3. Transparansi Status Pengujian Layanan Eksternal Saat Ini

Sesuai aturan kerja proyek, tidak ada integrasi eksternal yang diklaim telah terhubung ke upstream apabila credential aktif belum tersedia di environment saat ini:

| Integrasi | Status Implementasi & Kontrak Backend | Status Koneksi Live ke Upstream Saat Ini | Apa yang Dibutuhkan untuk Uji Upstream Live |
| :--- | :--- | :--- | :--- |
| **MCP Server (`/api/mcp`) & Tool Orchestrator** | Selesai penuh | **Teruji Live End-to-End** melalui koneksi HTTP nyata `StreamableHTTPClientTransport` -> `McpServer` | Tidak ada (sudah berjalan penuh secara lokal) |
| **OpenAI Responses API (`gpt-6-astra`)** | Selesai penuh (loop multi-round, multi-turn, error mapping) | Belum diuji ke server OpenAI karena `backend/.env` masih berisi placeholder `sk-placeholder-openai-key` | Isi `OPENAI_API_KEY=sk-...` aktif di `backend/.env` |
| **OpenAI Realtime Voice & WebRTC (`gpt-realtime-2.1`)** | Selesai penuh (`client-secrets`, `calls`, `hangup`, Sideband WS, `tool-call` relay) | Konfigurasi sesi, signaling handler, & tool relay teruji penuh; panggilan live ke `/v1/realtime/*` menunggu `OPENAI_API_KEY` aktif | Isi `OPENAI_API_KEY=sk-...` aktif di `backend/.env` |
| **OpenAI Native Web Search** | Selesai penuh (`web_search`, sitasi `url_citation`, `sources`, domain filter) | Menunggu `OPENAI_API_KEY` aktif | Isi `OPENAI_API_KEY=sk-...` aktif di `backend/.env` |
| **Google Maps Platform (Places New, Geocoding, Routes)** | Selesai penuh (field mask hemat SKU, normalisasi respons, deteksi billing `402`) | Menunggu `GOOGLE_MAPS_SERVER_API_KEY` dan **aktivasi Billing Account** pada project Google Cloud | 1) Aktifkan Billing Account + API (*Places API New*, *Geocoding API*, *Routes API*) + pasang Quota Cap di GCP Console; 2) Isi `GOOGLE_MAPS_SERVER_API_KEY` di `backend/.env` |

---

## 4. Panduan Verifikasi Live Setelah Mengisi API Key

Begitu Anda mengisi `OPENAI_API_KEY` (dan opsional `GOOGLE_MAPS_SERVER_API_KEY`) pada `backend/.env`, jalankan server dengan `npm run dev:backend` lalu uji menggunakan perintah PowerShell berikut:

```powershell
# 1. Pastikan status configured = true
Invoke-RestMethod http://localhost:5000/api/integrations/status | ConvertTo-Json -Depth 5

# 2. Uji percakapan OpenAI Responses API + Tool Calling daftar kos TERALIO
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/openai/responses `
  -ContentType 'application/json' `
  -Body '{"input":"Tampilkan daftar kos yang tersedia di TERALIO"}' | ConvertTo-Json -Depth 6

# 3. Uji OpenAI Web Search beserta sitasi URL
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/openai/web-search `
  -ContentType 'application/json' `
  -Body '{"query":"Informasi transportasi publik menuju Telkom University Bandung","forceSearch":true}' | ConvertTo-Json -Depth 6

# 4. Uji penerbitan Ephemeral Client Secret untuk WebRTC Realtime Voice
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/realtime/client-secrets `
  -ContentType 'application/json' `
  -Body '{"voice":"marin"}' | ConvertTo-Json -Depth 5

# 5. Uji pencarian tempat Google Maps (setelah GOOGLE_MAPS_SERVER_API_KEY & Billing aktif)
Invoke-RestMethod "http://localhost:5000/api/maps/places/search?query=Telkom+University+Bandung&maxResults=3" | ConvertTo-Json -Depth 6
```
