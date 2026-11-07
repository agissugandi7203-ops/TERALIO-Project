# Integrasi Google Maps Platform & Ketentuan Billing

Dokumen ini merinci implementasi layanan lokasi pada [`backend/services/googleMapsService.js`](../backend/services/googleMapsService.js), endpoint backend `/api/maps/*`, strategi penghematan SKU melalui *Field Masking*, pembagian API Key frontend vs backend, serta aturan billing Google Cloud yang wajib diperhatikan.

---

## 1. API Google Maps Platform yang Digunakan

Berdasarkan kebutuhan produk TERALIO (pencarian kos/tempat di sekitar kampus, detail tempat, konversi alamat, dan perhitungan jarak/waktu tempuh ke kampus), backend mengintegrasikan **3 API resmi terbaru** (tanpa legacy Places API v0 yang sudah deprecated):

| Layanan | Endpoint Upstream Google | Endpoint Backend TERALIO | Kegunaan di TERALIO |
| :--- | :--- | :--- | :--- |
| **Places API (New) — Text Search** | `POST https://places.googleapis.com/v1/places:searchText` | `GET` & `POST /api/maps/places/search` | Mencari kampus, kos, halte, stasiun, minimarket, rumah sakit berdasarkan nama/kata kunci & bias radius koordinat |
| **Places API (New) — Place Details** | `GET https://places.googleapis.com/v1/places/{placeId}` | `GET /api/maps/places/:placeId?level=basic\|contact\|full` | Mengambil nama, alamat, koordinat, link Google Maps, telepon, website, rating, jam buka, & deskripsi editorial |
| **Geocoding API** | `GET https://maps.googleapis.com/maps/api/geocode/json` | `GET` & `POST /api/maps/geocode` | Mengubah alamat teks menjadi koordinat `(lat, lng)` atau *reverse geocoding* koordinat ke alamat |
| **Routes API** | `POST https://routes.googleapis.com/directions/v2:computeRoutes` | `POST /api/maps/routes` | Menghitung jarak meter, durasi tempuh, dan encoded polyline rute (`WALK`, `TWO_WHEELER`, `DRIVE`, `BICYCLE`, `TRANSIT`) |

Selain dapat diakses melalui REST `/api/maps/*`, keempat operasi di atas juga terdaftar otomatis sebagai **AI Function Tools & MCP Tools** (`maps_search_places`, `maps_get_place_details`, `maps_geocode`, `maps_compute_route`).

---

## 2. Ketentuan Billing Google Cloud & Kuota Gratis Bulanan (PENTING)

Mengacu pada skema harga resmi Google Maps Platform terbaru (*per-SKU monthly free usage caps*):

1. **Billing Account Aktif Tetap Wajib**:
   - Seluruh API Google Maps Platform **mewajibkan project Google Cloud terhubung ke Billing Account yang aktif** (memiliki metode pembayaran valid).
   - **Kuota gratis bulanan TIDAK dapat dipakai tanpa Billing Account aktif.** Jika project belum memiliki billing aktif, Google mengembalikan error `BILLING_DISABLED` / `REQUEST_DENIED` yang oleh backend TERALIO diterjemahkan secara transparan menjadi HTTP **`402 GOOGLE_MAPS_BILLING_REQUIRED`**.
2. **Batas Gratis Bulanan per Kategori SKU (Reset Setiap Awal Bulan)**:
   - **Essentials SKUs**: hingga **10.000 request gratis / bulan** per SKU (contoh: `Geocoding`, `Compute Routes Essentials`).
   - **Pro SKUs**: hingga **5.000 request gratis / bulan** per SKU (contoh: `Text Search Pro`, `Place Details Pro`, `Compute Routes Pro`).
   - **Enterprise / Enterprise + Atmosphere SKUs**: hingga **1.000 request gratis / bulan** per SKU (contoh: `Place Details Enterprise`, `Place Details Enterprise + Atmosphere`).
3. **Perlindungan terhadap Tagihan Tak Terduga (Sebelum Anda Mengaktifkan Billing)**:
   - Di kode TERALIO, setiap panggilan `Places API (New)` dan `Routes API` menerapkan **`X-Goog-FieldMask` ketat** (tidak pernah memakai wildcard `*`), karena Google menagih berdasarkan **1 field termahal** di dalam mask.
   - Default `Routes API` diset ke `routingPreference: "TRAFFIC_UNAWARE"` agar tetap berada di tier **Essentials** (10.000 gratis/bulan), dan hanya naik ke **Pro** apabila parameter `trafficAware: true` diminta eksplisit.
   - Pada `Place Details`, parameter `level` memungkinkan pemilihan tier: `basic` (*Pro* — 5.000 gratis/bulan), `contact` (*Enterprise* — 1.000 gratis/bulan), atau `full` (*Enterprise + Atmosphere* — 1.000 gratis/bulan).
   - **Saran wajib saat Anda mengaktifkan API di Google Cloud Console**: atur **Quota Cap harian/bulanan** di menu *Google Maps Platform -> Quotas* di bawah batas gratis per SKU serta pasang **Budget Alert Rp 0 / $1** agar penggunaan tidak pernah melewati kuota gratis tanpa izin Anda.

---

## 3. Pemisahan API Key: Server vs Browser

Jangan pernah memakai satu API key yang sama untuk backend dan frontend:

| Jenis Key | Variabel Environment | Lokasi | Pembatasan Wajib di Google Cloud Console |
| :--- | :--- | :--- | :--- |
| **Server Key** | `GOOGLE_MAPS_SERVER_API_KEY` | `backend/.env` *(rahasia, server-only)* | **Application restriction**: IP addresses server (atau tanpa referrer untuk serverless) + **API restriction**: hanya *Places API (New)*, *Geocoding API*, dan *Routes API*. |
| **Browser Key** *(opsional, hanya bila merender peta interaktif JS di UI)* | `VITE_GOOGLE_MAPS_BROWSER_API_KEY` | `frontend/.env` *(publik di browser)* | **Application restriction**: **Websites (HTTP referrers)** misal `http://localhost:3000/*` & domain produksi + **API restriction**: hanya *Maps JavaScript API*. |

---

## 4. Format Data Lokasi Terstandarisasi

Seluruh respons tempat dari `googleMapsService` dinormalisasi ke bentuk seragam agar mudah dikonsumsi baik oleh model AI maupun komponen UI frontend:

```json
{
  "id": "ChIJ...",
  "name": "Telkom University",
  "primaryType": "university",
  "primaryTypeLabel": "Universitas",
  "address": "Jl. Telekomunikasi No.1, Terusan Buahbatu, Bandung",
  "location": { "lat": -6.9732, "lng": 107.6303 },
  "googleMapsUri": "https://maps.google.com/?cid=...",
  "businessStatus": "OPERATIONAL",
  "description": "Universitas swasta di Bandung Selatan...",
  "contact": {
    "phone": "022-7564108",
    "internationalPhone": "+62 22 7564108",
    "website": "https://telkomuniversity.ac.id/"
  },
  "rating": 4.7,
  "userRatingCount": 4120,
  "openingHours": {
    "openNow": true,
    "weekdayDescriptions": ["Senin: 08.00–16.00"]
  }
}
```
