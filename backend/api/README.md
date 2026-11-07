# API Layer - TERALIO Routing & Controllers

Direktori `backend/api/` merupakan gerbang komunikasi HTTP (*Presentation Layer*) aplikasi TERALIO. Bertanggung jawab memetakan rute URL, memvalidasi input HTTP dasar, mendelegasikan tugas ke layer `services/`, dan mengembalikan respon JSON terstandarisasi.

---

## 1. Daftar Rute API Saat Ini

| Method | Endpoint | Handler | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Inline Router | Health check server, uptime, dan timestamp |
| `GET` | `/api/supabase-status` | `itemsController.getSupabaseStatus` | Status konektivitas dan kredensial Supabase |
| `GET` | `/api/items` | `itemsController.getItems` | Mengambil seluruh daftar hunian (Supabase / local fallback) |
| `GET` | `/api/items/:id` | `itemsController.getItemById` | Mengambil detail spesifik hunian berdasarkan ID |
| `POST` | `/api/items` | `itemsController.createItem` | Membuat listing hunian baru dengan validasi schema |
| `GET` | `/api/openai/status` | Inline Router | Cek status integrasi OpenAI & ketersediaan API Key |
| `POST` | `/api/openai/chat` | Inline Router | Chat completions sederhana / simulasi pengujian |

---

## 2. Rute TERALIO yang Direncanakan (Roadmap)

Sejalan dengan integrasi penuh Voice Intelligence dan MCP Tools:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TERALIO PLANNED ENDPOINTS                       │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│ Endpoint            │ Method                   │ Fungsi Utama          │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ /api/live/session   │ POST                     │ Menerima SDP Offer    │
│                     │                          │ WebRTC dari browser,  │
│                     │                          │ memanggil OpenAI      │
│                     │                          │ GPT-Live 1, return    │
│                     │                          │ SDP Answer            │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ /api/mcp/invoke     │ POST                     │ Handler eksekusi      │
│                     │                          │ Remote MCP Tool yang  │
│                     │                          │ dipanggil oleh Agent  │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ /api/accommodations │ GET                      │ Endpoint hybrid       │
│ /recommend          │                          │ recommendation        │
│                     │                          │ terbobot              │
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

---

## 3. Format Standar Respon JSON

Untuk menjamin konsistensi pada frontend dan pengujian otomatis:

### A. Format Sukses (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": { ... }
}
```

### B. Format Error (`400 Bad Request`, `404 Not Found`, `500 Server Error`)
```json
{
  "success": false,
  "message": "Pesan deskripsi kesalahan",
  "errors": [ "Detail error spesifik 1", "Detail error 2" ]
}
```

---

## 4. Prinsip Clean Code pada Controller

1. **Thin Controller**:
   Controller dilarang keras memuat logika bisnis rumit, kalkulasi matematis, query database langsung, atau komunikasi SDK mentah. Tugas controller hanyalah:
   - Mengambil parameter: `const { id } = req.params;`
   - Memanggil service: `const data = await itemsService.getById(id);`
   - Mengembalikan status: `return res.status(200).json({ success: true, data });`
2. **Delegasi Error ke Next Middleware**:
   Seluruh blok `try / catch` pada controller wajib meneruskan error yang tidak tertangani ke parameter `next(err)` agar diproses secara terpusat oleh middleware di `backend/app.js`.
3. **Hindari Hardcoded Status Codes**:
   Gunakan HTTP status code yang representatif (`200` untuk sukses baca, `201` untuk sukses buat, `400` untuk validasi gagal, `404` untuk tidak ditemukan, `503` untuk layanan eksternal tidak tersedia).
