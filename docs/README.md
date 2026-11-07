# Dokumentasi Teknis TERALIO

Direktori `docs/` memuat dokumentasi arsitektur menyeluruh, spesifikasi antarmuka API, panduan database Supabase, serta instruksi deployment serverless pada Vercel.

---

## Indeks Dokumentasi Backend & Sistem

1. **[architecture.md](architecture.md) - Arsitektur Backend & Sistem Menyeluruh**
   - Diagram hubungan antarlayanan (OpenAI Responses, Realtime Voice, WebRTC, MCP, Web Search, Google Maps, Supabase), struktur modul `backend/`, dan ringkasan seluruh endpoint.

2. **[openai-integration.md](openai-integration.md) - Integrasi OpenAI API & Realtime Voice**
   - Evaluasi migrasi ke Responses API (`gpt-6-astra`), pengelolaan prompt terversi di kode, multi-turn `previousResponseId`, serta konfigurasi sesi suara GA `gpt-realtime-2.1`.

3. **[webrtc-integration.md](webrtc-integration.md) - Arsitektur & Mekanisme WebRTC**
   - Pembagian tanggung jawab Backend vs Frontend, alur Ephemeral Client Secret (`POST /api/realtime/client-secrets`), Unified SDP Exchange (`POST /api/realtime/calls`), Sideband WebSocket, dan Stateless Tool Relay (`POST /api/realtime/tool-call`).

4. **[mcp-tools.md](mcp-tools.md) - Integrasi Model Context Protocol (MCP) & Tool Orchestration**
   - TERALIO MCP Server (`/api/mcp` Streamable HTTP), External MCP Client Manager (`mcpClientService.js`), dan registri terpusat Zod (`toolOrchestrator.js`).

5. **[web-search.md](web-search.md) - Integrasi OpenAI Native Web Search**
   - Pencarian web otomatis maupun terarah (`POST /api/openai/web-search`), ekstraksi sitasi `url_citation` & `sources`, filter domain, dan delegasi untuk sesi suara Realtime.

6. **[google-maps.md](google-maps.md) - Integrasi Google Maps Platform & Ketentuan Billing**
   - Places API (New) Text Search & Place Details, Geocoding API, Routes API, strategi hemat SKU via `X-Goog-FieldMask`, pemisahan key Server vs Browser, dan persyaratan Billing Account GCP.

7. **[environment-setup.md](environment-setup.md) - Konfigurasi Environment Variables & Keamanan**
   - Referensi lengkap variabel `backend/.env` dan `frontend/.env`, redaksi log otomatis, rate limiting, `Cache-Control: no-store`, dan autentikasi endpoint.

8. **[testing.md](testing.md) - Skenario Pengujian & Hasil Validasi**
   - Cakupan 54 automated tests (7 test suites), transparansi status pengujian layanan eksternal, dan perintah verifikasi live setelah pengisian API key.

---

## Dokumentasi Pendukung & Referensi

9. **[API_SPEC.md](API_SPEC.md) - Spesifikasi Kontrak REST API Dasar**
   - Rincian endpoint dasar `/api/health`, `/api/supabase-status`, dan `/api/items`.

10. **[SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Panduan Database PostgreSQL & RLS**
    - Langkah pembuatan project Supabase, skema DDL tabel `items`, kebijakan RLS, dan seed data awal.

11. **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Panduan Deployment ke Vercel**
    - Konfigurasi `vercel.json` dan `api/index.js` (Serverless Function), penanganan routing SPA Vite dan Express backend.

12. **[openai/](openai/README.md) - Dokumentasi Referensi OpenAI Modern API (Responses, Decisions, GPT-Live & WebRTC)**
   - **[01-RESPONSES_API_OVERVIEW.md](openai/01-RESPONSES_API_OVERVIEW.md)**: Arsitektur Responses API, Items vs Messages, native tools, dan sunset Assistants API.
   - **[02-MIGRATION_GUIDE.md](openai/02-MIGRATION_GUIDE.md)**: 9 langkah migrasi dari Chat Completions ke Responses API, penyesuaian multi-turn, `text.format`, dan function calling.
   - **[03-DECISIONS_API.md](openai/03-DECISIONS_API.md)**: Panduan Decisions API (`gpt-6-luna`), 3 tipe pertanyaan (`predicate`, `choice`, `score`), evaluasi gambar/JSON, dan prompt caching.
   - **[04-STREAMING_EVENTS.md](openai/04-STREAMING_EVENTS.md)**: Arsitektur streaming dengan Semantic Typed Events (SSE) dan mitigasi risiko moderasi.
   - **[05-CODE_CHEATSHEET.md](openai/05-CODE_CHEATSHEET.md)**: Cheatsheet kode multi-bahasa (JS/TS, Python, Go, cURL).
   - **[06-FUNCTION_CALLING_AND_CUSTOM_TOOLS.md](openai/06-FUNCTION_CALLING_AND_CUSTOM_TOOLS.md)**: Alur 5 tahap tool calling, korelasi `call_id`, Namespaces, Tool Search, dan Custom Tools berbasis tata bahasa (Lark/Regex CFG).
   - **[07-WEB_SEARCH_TOOL.md](openai/07-WEB_SEARCH_TOOL.md)**: Konfigurasi native Web Search, filter domain, pencarian gambar web, geolokasi, dan kontrol akses offline.
   - **[08-GPT_LIVE_OVERVIEW_AND_DELEGATION.md](openai/08-GPT_LIVE_OVERVIEW_AND_DELEGATION.md)**: Arsitektur suara dua bagian (`gpt-live-1` + Backend), WebRTC full-duplex, dan perbandingan Responses vs Client Delegation.
   - **[09-GPT_LIVE_SESSION_MANAGEMENT_AND_FORKING.md](openai/09-GPT_LIVE_SESSION_MANAGEMENT_AND_FORKING.md)**: Manajemen sesi, auto-summarization (128k), 3 event injeksi konteks (`instructions`, `thinking`, `commentary`), 21 katalog suara, dan forking/download rekaman WAV stereo.
   - **[10-GPT_LIVE_MIGRATION_AND_GUARDRAILS.md](openai/10-GPT_LIVE_MIGRATION_AND_GUARDRAILS.md)**: Migrasi dari Realtime API & Chained Pipeline, teknik Prompt Splitting, koneksi Sideband WebSocket untuk guardrails server, dan mitigasi interupsi.
   - **[11-WEBRTC_AUDIO_INTEGRATION.md](openai/11-WEBRTC_AUDIO_INTEGRATION.md)**: Integrasi audio WebRTC browser-ke-server, pertukaran SDP via `POST /v1/live/sessions`, data channel `oai-events`, kredit inisialisasi 15 detik, dan Realtime Unified Interface.
   - **[12-AUDIO_FILE_TRANSCRIPTION.md](openai/12-AUDIO_FILE_TRANSCRIPTION.md)**: Transkripsi file audio dengan `gpt-transcribe`, parameter konteks (`prompt`, `keywords`, `languages`), speaker diarization, chunking PyDub, streaming, dan sunset massal 26 Februari 2027.
   - **[13-STRUCTURED_OUTPUTS_AND_PROMPTING.md](openai/13-STRUCTURED_OUTPUTS_AND_PROMPTING.md)**: Penjaminan skema JSON 100% via `strict: true`, helper SDK (Zod, Pydantic), UI generation rekursif (`$ref: "#"`), penanganan refusal, hierarki peran, dan shutdown `v1/prompts` (30 November 2026).
   - **[14-CODE_GENERATION_AND_CODEX.md](openai/14-CODE_GENERATION_AND_CODEX.md)**: Rekayasa perangkat lunak dengan `gpt-6-astra` dan `gpt-6.1-sol`, integrasi platform Codex (IDE, CLI, CI/CD), agentic coding loops, dan arsitektur frontend.
