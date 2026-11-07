# Integrasi OpenAI Web Search

Dokumen ini menjelaskan implementasi fitur pencarian informasi internet secara real-time pada backend TERALIO menggunakan **OpenAI Native Web Search Tool (`type: "web_search"`)** di atas **Responses API**.

---

## 1. Arsitektur & Tiga Jalur Penggunaan

Implementasi berpusat di [`backend/services/webSearchService.js`](../backend/services/webSearchService.js) dan terhubung ke tiga jalur:

1. **Otomatis di Percakapan Teks (`POST /api/openai/responses` & `/api/openai/chat`)**:
   - Hosted tool `{ type: "web_search" }` disertakan secara native bersama `tool_choice: "auto"`.
   - Model `gpt-6-astra` menentukan sendiri kapan pertanyaan dapat dijawab langsung dan kapan memerlukan pencarian web terkini (misal tarif transportasi publik terbaru, berita banjir area, regulasi kampus).
2. **Endpoint Pencarian Terarah (`POST /api/openai/web-search`)**:
   - Endpoint khusus untuk pencarian informasi terstruktur dengan kontrol lokasi pengguna, ukuran konteks pencarian (`low` | `medium` | `high`), pembatasan domain (`allowedDomains`), dan opsi `forceSearch: true`.
3. **Delegasi dari Sesi Suara Realtime (`teralio_web_search` pada `toolOrchestrator.js`)**:
   - Karena OpenAI Realtime API (`/v1/realtime`) hanya menerima tipe tool `function` dan `mcp`, model suara `gpt-realtime-2.1` memanggil function tool `teralio_web_search` yang mendelegasikan pencarian ke `webSearchService.search(...)` dan mengembalikan ringkasan jawaban beserta daftar sumber ke sesi suara maupun antarmuka pengguna.

---

## 2. Konfigurasi Parameter Resmi (`buildWebSearchToolConfig`)

Sesuai skema resmi OpenAI SDK `v7.53.0` (`WebSearchTool`):

```json
{
  "type": "web_search",
  "search_context_size": "medium",
  "external_web_access": true,
  "user_location": {
    "type": "approximate",
    "country": "ID",
    "city": "Bandung",
    "timezone": "Asia/Jakarta"
  },
  "filters": {
    "allowed_domains": ["bandung.go.id", "itb.ac.id", "telkomuniversity.ac.id"]
  }
}
```

- **`user_location.type: "approximate"`**: Wajib disertakan ketika mengirimkan metadata lokasi (`country`, `city`, `region`, `timezone`). Default negara diatur ke `ID` dan zona waktu `Asia/Jakarta`.
- **Normalisasi Domain (`filters.allowed_domains`)**: Maksimum 100 domain; prefiks `http://` atau `https://` serta trailing slash otomatis dibersihkan oleh `normalizeDomains()` sesuai persyaratan API OpenAI.
- **`include: ["web_search_call.action.sources"]`**: Selalu disertakan agar OpenAI mengembalikan daftar lengkap URL yang dikonsultasikan selama pencarian, bukan hanya URL yang dikutip di teks.

---

## 3. Struktur Sitasi & Sumber pada Respons (`extractWebSearchArtifacts`)

Setiap respons pencarian web mengembalikan struktur konsisten yang memisahkan jawaban teks, sitasi inline terindeks karakter, dan daftar sumber unik:

```json
{
  "success": true,
  "data": {
    "responseId": "resp_...",
    "model": "gpt-6-astra",
    "query": "Rute bus Trans Metro Pasundan ke Telkom University",
    "answer": "Koridor 3D Trans Metro Pasundan melayani rute Baleendah – BEC melewati kawasan Bojongsoang...",
    "searched": true,
    "citations": [
      {
        "title": "Rute Trans Metro Pasundan Bandung",
        "url": "https://bandung.go.id/...",
        "startIndex": 0,
        "endIndex": 92
      }
    ],
    "sources": [
      {
        "url": "https://bandung.go.id/...",
        "title": "Rute Trans Metro Pasundan Bandung",
        "origin": "cited_and_searched"
      }
    ],
    "searchCalls": [
      {
        "id": "ws_...",
        "status": "completed",
        "actionType": "search",
        "queries": ["rute trans metro pasundan telkom university"],
        "sourcesCount": 4
      }
    ]
  }
}
```
