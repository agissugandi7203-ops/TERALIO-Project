# OpenAI Modern API Documentation (Responses, Decisions, GPT-Live & WebRTC)

Dokumentasi ini merangkum pembaruan komprehensif arsitektur API OpenAI terbaru yang mencakup pengenalan **Responses API** (pengganti Chat Completions & penerus Assistants API), **Decisions API** (`gpt-6-luna`), arsitektur **Streaming** berbasis *semantic typed events*, agen suara **GPT-Live**, integrasi audio **WebRTC**, transkripsi file audio **`gpt-transcribe`**, penjaminan skema **Structured Outputs**, serta alur kerja **Codex**.

---

## 📑 Daftar Isi & Struktur Folder `docs/openai/`

| File | Topik Utama | Deskripsi Singkat |
| :--- | :--- | :--- |
| **[01-RESPONSES_API_OVERVIEW.md](01-RESPONSES_API_OVERVIEW.md)** | **Arsitektur & Konsep Responses API** | Evolusi dari Chat Completions, paradigma *Items vs Messages*, *native tools* (Web Search, File Search, Code Interpreter, MCP), stateful context, dan efisiensi biaya. |
| **[02-MIGRATION_GUIDE.md](02-MIGRATION_GUIDE.md)** | **Panduan Lengkap Migrasi API** | 9 langkah transisi dari `/v1/chat/completions` ke `/v1/responses`, penyesuaian multi-turn, Structured Outputs (`text.format`), Function Calling, dan *checklist roll-out*. |
| **[03-DECISIONS_API.md](03-DECISIONS_API.md)** | **Decisions API (`gpt-6-luna`)** | API evaluasi klasifikasi ~10x lebih cepat dengan tipe pertanyaan `predicate`, `choice`, dan `score`. Mendukung evaluasi JSON, gambar, prompt caching, dan output gratis ($0). |
| **[04-STREAMING_EVENTS.md](04-STREAMING_EVENTS.md)** | **Streaming & Semantic Typed Events** | Arsitektur HTTP streaming via Server-Sent Events (SSE), daftar *typed events* (teks, reasoning, tools), implementasi multi-bahasa, dan manajemen risiko moderasi. |
| **[05-CODE_CHEATSHEET.md](05-CODE_CHEATSHEET.md)** | **Cheatsheet & Perbandingan Kode** | Snippet kode praktis untuk JavaScript/TypeScript, Python, Go, Java, C#, Ruby, dan cURL yang membandingkan Chat Completions vs Responses API vs Decisions API. |
| **[06-FUNCTION_CALLING_AND_CUSTOM_TOOLS.md](06-FUNCTION_CALLING_AND_CUSTOM_TOOLS.md)** | **Function Calling & Custom Tools** | 5-step tool flow, penanganan `call_id`, Namespaces, Tool Search dinamis, Custom Tools dengan tata bahasa CFG (Lark & Regex), dan strict mode. |
| **[07-WEB_SEARCH_TOOL.md](07-WEB_SEARCH_TOOL.md)** | **Native Web Search Tool** | Konfigurasi tool pencarian internet bawaan, sitasi link interaktif, filter domain (allowed/blocked), pencarian gambar, geolokasi pengguna, dan mode offline. |
| **[08-GPT_LIVE_OVERVIEW_AND_DELEGATION.md](08-GPT_LIVE_OVERVIEW_AND_DELEGATION.md)** | **Arsitektur GPT-Live & Mode Delegasi** | Arsitektur suara dua bagian (`gpt-live-1` + Backend), WebRTC full-duplex, perbandingan Responses Delegation vs Client Delegation, dan optimasi latensi. |
| **[09-GPT_LIVE_SESSION_MANAGEMENT_AND_FORKING.md](09-GPT_LIVE_SESSION_MANAGEMENT_AND_FORKING.md)** | **Manajemen Sesi, Konteks & Forking** | Auto-summarization context (128k), 3 event penambahan konteks (`instructions`, `thinking`, `commentary`), 21 katalog suara, kontrol mic mute, dan forking/download rekaman WAV stereo. |
| **[10-GPT_LIVE_MIGRATION_AND_GUARDRAILS.md](10-GPT_LIVE_MIGRATION_AND_GUARDRAILS.md)** | **Panduan Migrasi GPT-Live & Guardrails** | Jalur migrasi dari Realtime API & Chained Pipeline, teknik *Prompt Splitting*, koneksi Sideband WebSocket untuk guardrails server, dan mitigasi interupsi. |
| **[11-WEBRTC_AUDIO_INTEGRATION.md](11-WEBRTC_AUDIO_INTEGRATION.md)** | **Integrasi Audio WebRTC** | Alur koneksi RTCPeerConnection browser-ke-server, pertukaran SDP via `POST /v1/live/sessions`, data channel `oai-events`, kredit inisialisasi 15 detik, dan Realtime Unified Interface. |
| **[12-AUDIO_FILE_TRANSCRIPTION.md](12-AUDIO_FILE_TRANSCRIPTION.md)** | **Transkripsi File Audio (`gpt-transcribe`)** | Transkripsi akurasi tinggi file s.d. 25MB, parameter `prompt`/`keywords`/`languages`, speaker diarization, chunking file panjang (PyDub), streaming, dan jadwal sunset 26 Februari 2027. |
| **[13-STRUCTURED_OUTPUTS_AND_PROMPTING.md](13-STRUCTURED_OUTPUTS_AND_PROMPTING.md)** | **Structured Outputs & Advanced Prompting** | Jaminan 100% skema JSON via `strict: true`, helper SDK (Zod, Pydantic), UI generation rekursif (`$ref: "#"`), penanganan refusal, hierarki peran, dan shutdown `v1/prompts` (30 Nov 2026). |
| **[14-CODE_GENERATION_AND_CODEX.md](14-CODE_GENERATION_AND_CODEX.md)** | **Generasi Kode & Alur Kerja Codex** | Pemilihan model koding (`gpt-6-astra` vs `gpt-6.1-sol`), integrasi agentic Codex (IDE, CLI, CI/CD), agentic coding loops, dan pola arsitektur frontend. |

---

## 🚀 Ringkasan Eksekutif (Key Takeaways)

### 1. Responses API: Paradigma Baru Agentic AI
- **Rekomendasi Utama**: Responses API adalah *primitive* standar baru untuk semua proyek baru OpenAI.
- **Sunset Assistants API**: Assistants API resmi dihentikan (*sunset*) pada 26 Agustus 2026 dan fungsinya diserap penuh ke dalam Responses API.
- **Agentic Loop Terintegrasi**: Model dapat memanggil multi-tool (Web Search, MCP, Code Interpreter, Custom Function) dalam satu *request* HTTP tanpa orkestrasi manual berbelit.
- **Efisiensi Caching & Penalaran**: Cache utilization meningkat antara 40% – 80% dibanding Chat Completions, serta evaluasi SWE-bench meningkat 3% pada model reasoning seperti GPT-5 / GPT-6.

### 2. GPT-Live (`gpt-live-1`) & WebRTC Dual-Track
- **Dua Pilar Terpisah**: Voice frontend (`gpt-live-1`) menangani percakapan lisan full-duplex secara natural, sementara backend (Responses atau Client Agent) menjalankan aksi, tools, dan database.
- **Media Tracks & Data Channel**: Audio dikirim melalui WebRTC media tracks, sedangkan event kontrol dan transkrip mengalir lewat data channel bertanda `"oai-events"`.
- **Kredit Inisialisasi 15 Detik**: Pembuatan sesi WebRTC menagih 15 detik durasi suara yang langsung dikreditkan ke sesi saat berjalan.
- **Forking & Auto-Summarization**: Kapasitas konteks 128k dengan auto-summarization otomatis di atas 90% pemakaian, serta kemampuan forking sesi tersimpan (`store: true`).

### 3. Transkripsi File Audio (`gpt-transcribe`) & Sunset Februari 2027
- **Model Baru Unggulan**: `gpt-transcribe` menggantikan model-model sebelumnya untuk file hingga 25MB.
- **Sunset Masif 26 Februari 2027**: `whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe`, `gpt-4o-transcribe-diarize`, dan `/v1/audio/translations` akan dimatikan permanen pada 26 Februari 2027.
- **Peningkatan Konteks**: Mendukung parameter `prompt` (konteks luas), `keywords` (istilah literal / akronim), dan `languages` (kode bahasa ISO).

### 4. Structured Outputs & Prompting As Code
- **100% Kepatuhan Skema**: Mengeliminasi kegagalan JSON parsing dan halusinasi key menggunakan *constrained decoding* (`strict: true`).
- **Skema Rekursif**: Mendukung struktur data hierarkis mendalam seperti UI tree generation melalui referensi `"$ref": "#"`.
- **Penghentian `v1/prompts` (30 November 2026)**: Prompt tidak lagi dikelola sebagai objek API terpisah, melainkan wajib dikelola sebagai kode (*version prompts in code*) di dalam repositori Git aplikasi.

### 5. Codex & Generasi Kode (`gpt-6-astra` & `gpt-6.1-sol`)
- **`gpt-6-astra`**: Default model untuk tugas koding harian dan integrasi API dengan penalaran tinggi.
- **`gpt-6.1-sol`**: Dikhususkan untuk agen rekayasa perangkat lunak otonom dan pengembangan antarmuka (frontend) di lingkungan Codex.
- **Agentic Loops**: Model koding dapat menjalankan tools linter, eksekusi unit test via `code_interpreter`, dan perbaikan mandiri dalam satu siklus interaksi.

### 6. Decisions API: Evaluasi Ultra Cepat & Hemat Biaya
- **Model Khusus**: Berjalan di atas model `gpt-6-luna` (~10x lebih cepat dibanding Responses API).
- **Output Gratis ($0)**: Biaya token keluaran digratiskan, menjadikannya ideal untuk routing, guardrails, dan scoring massal.
- **Tiga Tipe Pertanyaan**: `predicate` (boolean probability), `choice` (pilihan kategori), dan `score` (penilaian rubrik tertimbang).
