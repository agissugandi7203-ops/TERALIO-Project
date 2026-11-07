# Styles - TERALIO Design System & SaaS Styling

Direktori `frontend/styles/` mendefinisikan sistem desain visual, tipografi, variabel CSS (*design tokens*), dan layout responsif untuk platform TERALIO.

---

## 1. Filosofi Desain Visual TERALIO

TERALIO mengusung identitas visual **aplikasi SaaS modern yang bersih, cepat, dan berfokus pada konten**, bukan direktori iklan properti konvensional yang penuh banner promosi atau formulir padat.

Ciri khas desain TERALIO:
- **Card-Based Hierarchy**: Setiap properti, panel status, dan percakapan dibingkai dalam kartu dengan elevasi lembut (*subtle shadows*).
- **Semantik Status yang Tegas**: Hijau untuk sistem terhubung (*connected*), kuning/amber untuk mode simulasi/tertunda (*pending*), dan merah untuk kendala (*error*).
- **Tipografi Bersih & Terbaca**: Font sistem modern (`-apple-system`, `Segoe UI`, `Roboto`) yang nyaman dibaca pada layar ponsel maupun desktop.
- **Micro-Interactions**: Transisi halus pada tombol, efek hover pada kartu hunian, dan visualisasi aktivitas suara yang dinamis.

---

## 2. Struktur Berkas Styling

| Berkas | Tanggung Jawab |
| :--- | :--- |
| **`index.css`** | Reset CSS global, deklarasi variabel `--primary`, `--bg-main`, `--border-color`, dan aturan tipografi dasar. |
| **`App.css`** | Layout container (`.app-container`, `.page-container`), kartu dashboard, header branding, badges, dan komponen tombol. |

---

## 3. Design Tokens (CSS Variables)

Variabel inti yang dideklarasikan di `:root` (`index.css`):

```css
:root {
  /* Brand & Actions */
  --primary: #3b82f6;          /* Biru aksi utama */
  --primary-hover: #2563eb;
  --secondary: #10b981;        /* Hijau status sukses */
  
  /* Backgrounds & Surfaces */
  --bg-main: #f8fafc;          /* Abu-abu sangat lembut untuk latar belakang */
  --bg-card: #ffffff;          /* Putih solid untuk kartu */
  
  /* Text */
  --text-main: #0f172a;        /* Slate gelap untuk teks judul */
  --text-muted: #64748b;       /* Slate medium untuk teks sekunder */
  
  /* Borders & Shadows */
  --border-color: #e2e8f0;
  --radius: 12px;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

---

## 4. Standar Clean Code untuk Styling

1. **Gunakan Design Tokens**:
   - Selalu gunakan `var(--nama-variabel)` daripada menulis nilai hex warna atau ukuran border-radius secara langsung di dalam kelas CSS.
2. **Hindari Deep Nesting**:
   - Batasi nesting selector maksimal 2 level (misal `.card .card-title`) untuk menjaga spesifisitas CSS tetap rendah dan mudah ditimpa.
3. **Responsive Mobile-First**:
   - Gunakan CSS Grid `repeat(auto-fit, minmax(300px, 1fr))` atau Flexbox agar tampilan menyesuaikan ukuran layar perangkat tanpa perlu media query yang berbelit-belit.
4. **Hindari `!important`**:
   - Jangan gunakan deklarasi `!important` kecuali untuk kelas utility helper yang sangat spesifik.
