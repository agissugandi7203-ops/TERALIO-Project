# Services - TERALIO Domain Logic, MCP & AI Integrations

Direktori `backend/services/` adalah jantung dari logika bisnis (*Domain Layer*) platform TERALIO. Di sinilah keputusan pencarian, integrasi AI (OpenAI GPT-Live), remote MCP tools, algoritma *hybrid recommendation*, serta komunikasi database (Supabase) dikelola.

---

## 1. Inventaris Services Saat Ini

| Service | File | Tanggung Jawab |
| :--- | :--- | :--- |
| **OpenAI Service** | `openaiService.js` | Menginisialisasi OpenAI client, memeriksa status API key, mengeksekusi chat completions, dan menyediakan simulasi fallback saat development. |
| **Supabase Service** | `supabaseService.js` | Menginisialisasi Supabase client dengan safe-guard kredensial dan helper `isSupabaseConfigured()`. |
| **Items Service** | `itemsService.js` | Mengambil data hunian dari PostgreSQL Supabase dengan *graceful local fallback* untuk testing/offline mode. |

---

## 2. Arsitektur Hybrid Recommendation Service (TERALIO Core)

Sesuai visi produk TERALIO, rekomendasi properti tidak boleh diserahkan murni kepada LLM untuk mencegah halusinasi data harga atau ketersediaan. Logika rekomendasi diimplementasikan dalam 4 tahapan berurutan:

```
                          [ Input Percakapan ]
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 1: PREFERENCE EXTRACTION                                         │
│ Mengonversi dialog alami menjadi format JSON terstruktur:              │
│ {                                                                      │
│   "campus": "Telkom University",                                       │
│   "budget": { "max": 1500000 },                                        │
│   "required": { "private_bathroom": true, "wifi": true },              │
│   "priorities": ["distance", "private_bathroom", "price"]              │
│ }                                                                      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 2: HARD FILTERING (SQL / PostGIS)                                │
│ Menyaring properti yang mutlak memenuhi syarat wajib:                 │
│ • status == 'available'                                                │
│ • price <= budget.max                                                  │
│ • distance_meters <= 2000                                              │
│ • has_private_bathroom == true                                         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 3: PREFERENCE RANKING (Matematis Terbobot)                       │
│ Menghitung total skor keselarasan (0 - 100) untuk properti yang lolos:  │
│                                                                        │
│ Skor = (SkorJarak * 0.35) + (SkorHarga * 0.30) +                      │
│        (SkorFasilitas * 0.25) + (SkorLingkungan * 0.10)                │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 4: RECOMMENDATION EXPLANATION (Grounded AI)                      │
│ AI menyusun narasi suara/teks berdasarkan alasan faktual data:         │
│ "Kos Harmoni menjadi pilihan pertama karena harganya Rp1,2 jt          │
│  (di bawah budget), memiliki kamar mandi dalam, dan hanya 850m         │
│  dari kampus."                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Remote MCP Tools Implementation

Agen AI GPT-Live 1 berinteraksi dengan layanan TERALIO melalui antarmuka MCP (*Model Context Protocol*). Setiap tool didefinisikan sebagai fungsi independen pada service layer:

```javascript
export const mcpTools = {
  // 1. Mencari hunian berdasarkan kriteria terstruktur
  async search_accommodations({ campus, maxBudget, facilities }) { ... },

  // 2. Mengambil detail lengkap properti spesifik
  async get_accommodation_details({ propertyId }) { ... },

  // 3. Menghasilkan matriks komparasi 2–3 kos
  async compare_accommodations({ propertyIds }) { ... },

  // 4. Mencari fasilitas penunjang (laundry, minimarket, halte)
  async find_nearby_facilities({ propertyId, radiusMeters }) { ... },

  // 5. Memperbarui preferensi pengguna dari percakapan lanjutan
  async refine_recommendations({ previousResults, newPreference }) { ... },

  // 6. Menyimpan properti ke daftar favorit
  async save_favorite({ userId, propertyId }) { ... }
};
```

---

## 4. Prinsip Clean Code pada Services

1. **Stateless & Idempotent**: Service tidak boleh mengasumsikan instance memori akan hidup selamanya. Setiap pemanggilan harus membawa parameter yang diperlukan atau mengambilnya dari database.
2. **Deterministic Calculations**: Perhitungan ranking, pembobotan, dan filtering dilakukan oleh fungsi JavaScript murni yang teruji secara matematis, bukan diprediksi oleh AI.
3. **Graceful Fallbacks**: Apabila layanan eksternal (OpenAI atau Supabase) mengalami timeout atau kendala jaringan, service harus menangkap error tersebut dan memberikan respons cadangan yang informatif tanpa mematikan proses backend.
4. **Testability**: Service dirancang untuk menerima dependency injection atau menyediakan helper reset (seperti `_resetMemoryItems`) agar dapat diverifikasi 100% oleh unit test otomatis.
