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


---

## 6. Authentication: Registrasi Akun Baru
Mendaftarkan akun mahasiswa baru menggunakan email dan password.

- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "mahasiswa@teralio.com",
  "password": "password123",
  "fullName": "Ahmad Dani"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "user": {
      "id": "usr-12345",
      "email": "mahasiswa@teralio.com",
      "fullName": "Ahmad Dani",
      "provider": "email"
    },
    "session": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "...",
      "expiresIn": 3600
    }
  }
}
```

---

## 7. Authentication: Login Email & Password
Masuk ke akun yang sudah terdaftar.

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "mahasiswa@teralio.com",
  "password": "password123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "usr-12345",
      "email": "mahasiswa@teralio.com",
      "fullName": "Ahmad Dani"
    },
    "session": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "...",
      "expiresIn": 3600
    }
  }
}
```

---

## 8. Authentication: Login with Google (OAuth)
Mendapatkan URL otentikasi Google untuk login sekali klik.

- **URL:** `/api/auth/google`
- **Method:** `GET`
- **Query Params:**
  - `redirectTo`: URL tujuan setelah otentikasi Google selesai (opsional)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Google OAuth URL berhasil dibuat",
  "data": {
    "provider": "google",
    "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

---

## 9. Authentication: Lupa Password (Forgot Password)
Mengirimkan tautan reset password ke email pengguna.

- **URL:** `/api/auth/forgot-password`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "mahasiswa@teralio.com",
  "redirectTo": "http://localhost:3000/auth/reset-password"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Tautan reset password telah dikirimkan ke email Anda jika terdaftar"
}
```

---

## 10. Authentication: Reset Password Baru
Memperbarui kata sandi dengan kata sandi baru.

- **URL:** `/api/auth/reset-password`
- **Method:** `POST`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <token-reset>` (opsional jika via token session)
- **Request Body:**
```json
{
  "newPassword": "newpassword2026"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Password berhasil diperbarui"
}
```

---

## 11. Authentication: Ambil Profil Pengguna Aktif
Mengambil data profil pengguna yang sedang login.

- **URL:** `/api/auth/me`
- **Method:** `GET`
- **Headers:**
  - `Authorization: Bearer <access-token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "usr-12345",
    "email": "mahasiswa@teralio.com",
    "fullName": "Ahmad Dani",
    "avatarUrl": "https://...",
    "provider": "email"
  }
}
```

---

## 12. Authentication: Logout
Keluar dari sesi akun.

- **URL:** `/api/auth/logout`
- **Method:** `POST`
- **Headers:**
  - `Authorization: Bearer <access-token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Berhasil keluar"
}
```
