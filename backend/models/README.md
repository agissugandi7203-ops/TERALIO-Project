# Models - TERALIO Entities & Schema Validation

Direktori `backend/models/` mendefinisikan struktur data (*Domain Entities*), skema validasi masukan, serta pemetaan baris database (*Data Mappers*) untuk seluruh platform TERALIO.

---

## 1. Tanggung Jawab Layer Models

Dalam prinsip Clean Code:
1. **Runtime Validation**: Memvalidasi seluruh data masukan dari klien sebelum diteruskan ke database atau diproses oleh kalkulator rekomendasi.
2. **Data Integrity & Immutability**: Mengonversi baris mentah dari database PostgreSQL (Supabase) menjadi objek model yang terstandarisasi.
3. **Anti-Hallucination Guard**: Menjamin properti memiliki atribut faktual yang jelas (harga, ketersediaan, jarak meter aktual, status verifikasi) sehingga AI tidak merekomendasikan data palsu.

---

## 2. Berkas Model Saat Ini

- **`itemModel.js`**:
  - Mengatur entitas `ItemModel` dengan atribut: `id`, `title`, `description`, `category`, `createdAt`.
  - Menyediakan fungsi validasi runtime `ItemModel.validate(data)`:
    - Memastikan `title` terisi, berupa string, dan tidak melebihi 100 karakter.
    - Memastikan `description` berupa string jika disediakan.
  - Menyediakan mapper `ItemModel.fromDatabaseRow(row)` untuk mengubah format `snake_case` PostgreSQL menjadi camelCase JavaScript.

---

## 3. Skema Entitas TERALIO (Domain Roadmap)

Entitas data utama yang menjadi standar informasi properti TERALIO:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      ACCOMMODATION DOMAIN ENTITY                       │
├─────────────────────┬───────────────────┬──────────────────────────────┤
│ Field               │ Type              │ Contoh / Nilai               │
├─────────────────────┼───────────────────┼──────────────────────────────┤
│ id                  │ String (UUID/ID)  │ "PROP-001"                   │
│ name                │ String            │ "Kos Harmoni Telkom"         │
│ monthlyPrice        │ Number (IDR)      │ 1200000                      │
│ campusTarget        │ String            │ "Telkom University"          │
│ distanceMeters      │ Number (Meters)   │ 850                          │
│ coordinates         │ { lat, lng }      │ { lat: -6.974, lng: 107.63 } │
│ roomType            │ Enum              │ "single" | "shared"          │
│ furnishedStatus     │ Enum              │ "furnished" | "unfurnished"  │
│ privateBathroom     │ Boolean           │ true                         │
│ wifiSpeedMbps       │ Number            │ 50                           │
│ electricityIncluded │ Boolean           │ false                        │
│ isAvailable         │ Boolean           │ true                         │
│ isVerified          │ Boolean           │ true                         │
│ images              │ Array<String>     │ ["https://.../room1.jpg"]    │
│ rules               │ Array<String>     │ ["Bebas jam malam", "No pet"]│
│ updatedAt           │ ISO8601 String    │ "2026-11-07T08:00:00Z"       │
└─────────────────────┴───────────────────┴──────────────────────────────┘
```

---

## 4. Prinsip Clean Code pada Models

1. **Pure Validation Functions**:
   Fungsi validasi harus bersifat deterministik dan murni (*pure function*): menerima data objek, mengembalikan `{ isValid: boolean, errors: string[] }`. Tidak boleh melakukan I/O atau memanggil database di dalam validator model.
2. **Pemisahan Skema Database vs Kontrak API**:
   Gunakan fungsi *mapper* (`fromDatabaseRow`) agar perubahan nama kolom pada tabel database tidak merusak kode frontend atau endpoint API yang sudah ada.
3. **Data Sanitization**:
   Potong spasi yang tidak perlu (`.trim()`) dan pastikan tipe data angka (`price`, `distanceMeters`) dikonversi ke tipe data `Number` untuk mencegah kesalahan kalkulasi skor ranking.
