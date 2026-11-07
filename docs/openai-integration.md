# Integrasi OpenAI API & Realtime Voice

Dokumen ini menjelaskan evaluasi implementasi OpenAI sebelumnya di TERALIO serta arsitektur baru yang telah diimplementasikan menggunakan **OpenAI SDK `v7.53.0`**, **Responses API**, dan **Realtime API GA (`gpt-realtime-2.1`)**.

---

## 1. Evaluasi Implementasi Sebelumnya vs Pembaruan

| Aspek | Kondisi Sebelumnya | Implementasi Baru |
| :--- | :--- | :--- |
| **API Primitive Teks** | `client.chat.completions.create` (`/v1/chat/completions`) | **`client.responses.create`** (`/v1/responses`) |
| **Model Teks Default** | `gpt-4o-mini` | **`gpt-6-astra`** (`OPENAI_TEXT_MODEL`) dengan `reasoning.effort` terkonfigurasi |
| **Pengelolaan Konteks Sesi** | Stateless satu giliran tanpa riwayat | Stateful multi-turn via `previousResponseId` (`store: true`) atau replay array item (`store: false`) |
| **Instruksi Sistem** | Hardcoded 1 kalimat di dalam fungsi service | Terkelola terstruktur di [`backend/config/prompts.js`](../backend/config/prompts.js) (`buildSessionInstructions`) |
| **Integrasi Tools** | Tidak ada | Orkestrasi multi-round otomatis (Function Calling, External MCP, Native `web_search`) |
| **Realtime Voice** | Belum tersedia | **`gpt-realtime-2.1`** via `/v1/realtime/client_secrets`, `/v1/realtime/calls`, Sideband WS, & Tool Relay |
| **Timeout & Retry** | Tidak dikonfigurasi | `OPENAI_TIMEOUT_MS=30000`, `OPENAI_MAX_RETRIES=2`, normalisasi `fromOpenAiError` |

---

## 2. Pengelolaan Prompt di Kode (`backend/config/prompts.js`)

Mengacu pada dokumentasi resmi OpenAI terbaru, fitur *reusable prompt objects* (`v1/prompts`) dijadwalkan **sunset pada 30 November 2026** dan OpenAI merekomendasikan pendekatan **Version Prompts in Code**.

Modul [`backend/config/prompts.js`](../backend/config/prompts.js) memisahkan 3 profil instruksi:
1. `TERALIO_TEXT_INSTRUCTIONS` — Untuk agen percakapan teks berbasis Responses API.
2. `TERALIO_REALTIME_VOICE_INSTRUCTIONS` — Dioptimalkan untuk percakapan suara dua arah (kalimat ringkas 1-3 kalimat, ramah interupsi, tidak membacakan URL mentah).
3. `TERALIO_WEB_SEARCH_INSTRUCTIONS` — Untuk sintesis pencarian web berbasis bukti dan sitasi.

Fungsi `buildSessionInstructions({ mode, customInstructions, userContext })` memungkinkan penyisipan konteks preferensi pengguna (misal kampus tujuan & batas anggaran) tanpa menimpa aturan anti-halusinasi inti.

---

## 3. OpenAI Responses API (`POST /api/openai/responses`)

Diimplementasikan pada [`backend/services/openaiService.js`](../backend/services/openaiService.js).

### Contoh Request
```json
{
  "input": "Saya mahasiswa baru Telkom University dengan budget Rp 1,5 juta. Ada kos yang cocok?",
  "previousResponseId": "resp_opsional_turn_sebelumnya",
  "userContext": {
    "campus": "Telkom University",
    "maxBudget": 1500000,
    "requiredFacilities": ["kamar mandi dalam", "wifi"]
  },
  "reasoningEffort": "low",
  "enableTools": true,
  "enableWebSearch": true
}
```

### Alur Orkestrasi Multi-Round
1. Backend memanggil `client.responses.create` dengan daftar tools dari `toolOrchestrator.getResponsesTools(...)` serta `include: ['web_search_call.action.sources']`.
2. Jika `response.output` berisi satu atau lebih item `function_call`, backend mengeksekusinya secara paralel melalui `toolOrchestrator.executeToolCall(...)`.
3. Hasil eksekusi dibungkus menjadi item `{ type: "function_call_output", call_id, output }` dan dikirim kembali ke `client.responses.create` bersama `previous_response_id: response.id` hingga maksimum `OPENAI_AGENT_MAX_TOOL_ROUNDS` (default `5`).
4. Respons akhir mengembalikan `responseId` (simpan di frontend untuk giliran berikutnya), `outputText`, jejak `toolCalls`, serta objek `webSearch` (`citations` & `sources`).

> Catatan kompatibilitas: Endpoint lama `POST /api/openai/chat` tetap dipertahankan agar komponen eksisting seperti `OpenAiCard.jsx` tetap berjalan, dan otomatis memakai Responses API saat `OPENAI_API_KEY` aktif.

---

## 4. Konfigurasi Model & Sesi Realtime Voice (`gpt-realtime-2.1`)

Diimplementasikan pada [`backend/services/realtimeService.js`](../backend/services/realtimeService.js).

### Ketentuan Spesifikasi GA Realtime API yang Diterapkan
- **Pemilihan Model Aktif**: Default menggunakan **`gpt-realtime-2.1`** (atau varian hemat biaya **`gpt-realtime-2.1-mini`**). Model lama seperti `gpt-4o-realtime-preview`, `gpt-realtime`, dan `gpt-realtime-mini` secara eksplisit ditolak oleh validator karena dijadwalkan dihentikan pada **20 Januari 2027**.
- **Aturan `output_modalities`**: Pada spesifikasi GA Realtime API terbaru, `output_modalities` **hanya boleh berisi `["audio"]` (yang sudah mencakup audio + transkrip teks) ATAU `["text"]`**, dan **tidak boleh keduanya sekaligus**. Validator otomatis menjaga kepatuhan ini.
- **Input Audio & Turn Detection (Full-Duplex)**:
  - `audio.input.noise_reduction`: `{ type: "near_field" }` (default untuk mikrofon laptop/ponsel; dapat diubah ke `"far_field"`).
  - `audio.input.transcription`: `{ model: "gpt-transcribe", language: "id" }` (menggunakan `gpt-transcribe`, bukan `whisper-1` yang akan sunset 26 Februari 2027).
  - `audio.input.turn_detection`: `{ type: "semantic_vad", eagerness: "auto", create_response: true, interrupt_response: true }` sehingga pengguna bebas menyela (*barge-in*) secara alami.
- **Output Suara**:
  - `audio.output.voice`: Default `marin` (mendukung `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`).
- **Reasoning**:
  - `reasoning: { effort: "low" }` + `parallel_tool_calls: true` untuk model keluarga `gpt-realtime-2*`.

### Endpoint Inspeksi & Pembuatan Sesi
- `GET /api/realtime/status` — Memeriksa kesiapan credential, model aktif, daftar voice yang didukung, dan URL WebRTC.
- `POST /api/realtime/config` — Memvalidasi dan mengembalikan objek `RealtimeSessionCreateRequest` utuh untuk pengujian konfigurasi tanpa memotong kuota OpenAI.
- `POST /api/realtime/client-secrets` — Menerbitkan ephemeral client credential (`ek_...`) dengan header `Cache-Control: no-store`.
- `POST /api/realtime/calls` — Unified WebRTC SDP exchange dari server.
