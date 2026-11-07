# Spesifikasi API Express Backend

Semua endpoint API Express memiliki prefix `/api`.

Base URL Development: `http://localhost:5000/api`

---

## 1. Health Check
Mengecek status kesehatan server backend.

- **URL:** `/api/health`
- **Method:** `GET`
- **Response (200 OK):**
```json
{
  "status": "ok",
  "uptime": 45.12,
  "timestamp": "2026-11-07T08:00:00.000Z",
  "service": "Himtech Express Backend"
}
```

---

## 2. Supabase Integration Status
Mengecek apakah kredensial Supabase sudah terkonfigurasi dengan benar di backend.

- **URL:** `/api/supabase-status`
- **Method:** `GET`
- **Response (200 OK):**
```json
{
  "success": true,
  "service": "Supabase",
  "configured": true,
  "details": {
    "urlProvided": true,
    "hasKey": true,
    "mode": "Connected to Supabase"
  }
}
```

---

## 3. Ambil Daftar Items
Mendapatkan semua item (dari database Supabase atau fallback lokal).

- **URL:** `/api/items`
- **Method:** `GET`
- **Response (200 OK):**
```json
{
  "success": true,
  "source": "supabase",
  "count": 3,
  "data": [
    {
      "id": "1",
      "title": "Inisialisasi Project Frontend (Vite)",
      "description": "Setup struktur folder frontend dengan komponen React dan Vite bundler.",
      "category": "Frontend",
      "createdAt": "2026-11-07T08:00:00.000Z"
    }
  ]
}
```

---

## 4. Ambil Detail Item Berdasarkan ID
- **URL:** `/api/items/:id`
- **Method:** `GET`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Inisialisasi Project Frontend (Vite)",
    "description": "Setup struktur folder frontend...",
    "category": "Frontend",
    "createdAt": "2026-11-07T08:00:00.000Z"
  }
}
```
- **Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Item dengan ID '99' tidak ditemukan"
}
```

---

## 5. Tambah Item Baru
Membuat item baru.

- **URL:** `/api/items`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "title": "Item Baru",
  "description": "Deskripsi item yang ingin ditambahkan",
  "category": "General"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Item berhasil dibuat",
  "source": "supabase",
  "data": {
    "id": "4",
    "title": "Item Baru",
    "description": "Deskripsi item yang ingin ditambahkan",
    "category": "General",
    "createdAt": "2026-11-07T08:05:00.000Z"
  }
}
```
- **Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": [
    "Field \"title\" is required and must be a non-empty string"
  ]
}
```
