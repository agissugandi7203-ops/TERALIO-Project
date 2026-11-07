# 13. Structured Outputs & Advanced Prompting

Dokumentasi ini merangkum kapabilitas **Structured Outputs** (penjaminan skema JSON 100%), perbandingan dengan JSON Mode, helper SDK (Zod, Pydantic), pola rekursif UI generation, penanganan *edge cases* (refusal & token limits), hierarki peran prompt (`developer` vs `user`), serta jadwal penutupan (*sunset*) endpoint reusable prompts (`v1/prompts`).

---

## 1. Definisi & Keunggulan Structured Outputs

**Structured Outputs** adalah fitur OpenAI yang memastikan model secara matematis selalu menghasilkan output JSON yang mematuhi **JSON Schema** yang Anda definisikan (menggunakan teknik *constrained decoding*).

### Keunggulan Utama:
1. **Type-Safety Tanpa Validasi Berulang**: Tidak perlu loop retry atau validasi manual karena model tidak akan pernah melewatkan key wajib atau memproduksi enum yang salah.
2. **Explicit Refusals**: Jika permintaan melanggar kebijakan keselamatan, penolakan disampaikan secara terprogram melalui field `refusal`, bukan output JSON yang cacat.
3. **Prompt Lebih Efisien**: Mengurangi teks prompt berulang ("hanya kembalikan JSON tanpa penjelasan").

---

## 2. Perbandingan: Structured Outputs vs. JSON Mode

| Dimensi | JSON Mode | Structured Outputs (`strict: true`) |
| :--- | :--- | :--- |
| **Jaminan Sintaks JSON** | ✅ Menjamin sintaks JSON valid (`{...}`) | ✅ Menjamin sintaks JSON valid |
| **Kepatuhan Terhadap Skema** | ❌ Rentan halusinasi key atau tipe data | ✅ **100% patuh skema JSON Schema** |
| **Field Wajib (*Required*)** | ❌ Model bisa melupakan key tertentu | ✅ Semua field wajib dijamin ada |
| **Nilai Enum** | ❌ Model bisa membuat nilai di luar daftar | ✅ Terbatas mutlak pada nilai enum yang ditentukan |
| **Penanganan Refusal** | ❌ Teks penolakan tercampur ke dalam string | ✅ Dikirim terpisah via field `refusal` |
| **Cara Konfigurasi (Responses API)** | `text: { format: { type: "json_object" } }` | `text: { format: { type: "json_schema", strict: true, ... } }` |

---

## 3. Aturan Ketat JSON Schema (`strict: true`)

Agar skema valid untuk Structured Outputs, Anda wajib memenuhi aturan berikut:
1. Setiap objek harus mendefinisikan `"additionalProperties": false`.
2. Semua properti yang dideklarasikan dalam `properties` harus dicantumkan dalam array `"required"`. Jika suatu properti bersifat opsional, definisikan nilainya sebagai union tipe dengan `null` (misal: `type: ["string", "null"]`).
3. Tipe rekursif (misal: pohon folder, komponen UI bertingkat) didukung penuh menggunakan referensi root: `"$ref": "#"`.

---

## 4. Implementasi SDK: Zod & Pydantic

OpenAI SDK modern menyediakan metode khusus `responses.parse` yang secara otomatis mengonversi schema kode menjadi JSON schema dan mem-parsing hasilnya ke object bertipe:

### JavaScript / TypeScript (Zod & `zodTextFormat`)
```typescript
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI();

const CalendarEvent = z.object({
  name: z.string(),
  date: z.string(),
  participants: z.array(z.string()),
});

const response = await openai.responses.parse({
  model: "gpt-6-astra",
  input: [
    { role: "system", content: "Ekstrak informasi acara dari pesan pengguna." },
    { role: "user", content: "Arief dan Budi akan menghadiri rapat proyek hari Jumat jam 10." },
  ],
  text: {
    format: zodTextFormat(CalendarEvent, "event_info"),
  },
});

// event otomatis memiliki tipe CalendarEvent
const event = response.output_parsed;
console.log(event.name, event.date, event.participants);
```

### Python (Pydantic `BaseModel`)
```python
from openai import OpenAI
from pydantic import BaseModel

client = OpenAI()

class CalendarEvent(BaseModel):
    name: str
    date: str
    participants: list[str]

response = client.responses.parse(
    model="gpt-6-astra",
    input=[
        {"role": "system", "content": "Ekstrak informasi acara dari pesan pengguna."},
        {"role": "user", "content": "Arief dan Budi akan menghadiri rapat proyek hari Jumat jam 10."},
    ],
    text_format=CalendarEvent,
)

event = response.output_parsed
print(event.name, event.date, event.participants)
```

---

## 5. Pola Produksi Tingkat Lanjut (Advanced Patterns)

### A. Chain of Thought (Penalaran Bertahap)
Memaksa model untuk menjabarkan langkah-langkah penalaran sebelum memberikan kesimpulan akhir:
```python
class Step(BaseModel):
    explanation: str
    output: str

class MathReasoning(BaseModel):
    steps: list[Step]
    final_answer: str

response = client.responses.parse(
    model="gpt-6-astra",
    input="Selesaikan persamaan aljabar: 8x + 7 = -23",
    text_format=MathReasoning,
)
```

### B. UI Generation Rekursif (Pohon Komponen Dinamis)
Menghasilkan struktur komponen web/form yang valid secara rekursif:
```python
from enum import Enum
from pydantic import BaseModel

class UIType(str, Enum):
    div = "div"
    button = "button"
    header = "header"
    section = "section"
    field = "field"
    form = "form"

class Attribute(BaseModel):
    name: str
    value: str

class UI(BaseModel):
    type: UIType
    label: str
    children: list["UI"]
    attributes: list[Attribute]

UI.model_rebuild()  # Diperlukan Pydantic untuk mengaktifkan skema tipe rekursif

class UIResponse(BaseModel):
    ui: UI

response = client.responses.parse(
    model="gpt-6-astra",
    input="Buatkan Form Profil Pengguna lengkap dengan field nama, email, dan tombol simpan.",
    text_format=UIResponse,
)
```

### C. Moderasi & Kepatuhan Konten (Content Compliance)
```typescript
const ContentCompliance = z.object({
  is_violating: z.boolean(),
  category: z.enum(["violence", "sexual", "hate_speech", "none"]),
  explanation: z.string().nullable(),
  confidence_score: z.number().min(0).max(1),
});
```

---

## 6. Penanganan Edge Cases (Refusals & Max Output Tokens)

Meskipun skema diatur secara ketat, dua situasi pengecualian harus ditangani dalam kode produksi:

```javascript
try {
  const response = await openai.responses.create({
    model: "gpt-6-astra",
    input: userInput,
    max_output_tokens: 1024,
    text: { format: { type: "json_schema", name: "output", schema: mySchema, strict: true } }
  });

  // 1. Cek pemotongan token
  if (response.status === "incomplete" && response.incomplete_details?.reason === "max_output_tokens") {
    throw new Error("Respon terpotong sebelum selesai karena batas token tercapai.");
  }

  const message = response.output.find((item) => item.type === "message");
  const content = message?.content[0];

  // 2. Cek apakah model menolak karena kebijakan keselamatan (Safety Refusal)
  if (content?.type === "refusal") {
    console.warn("Permintaan ditolak oleh model:", content.refusal);
  } else if (content?.type === "output_text") {
    console.log("JSON valid:", JSON.parse(content.text));
  }
} catch (err) {
  console.error("Terjadi error penanganan:", err);
}
```

---

## 7. Hierarki Peran Prompt & Penghentian `v1/prompts`

### Hierarki Otoritas Pesan (Chain of Command)
OpenAI menerapkan hierarki otoritas yang tegas terhadap instruksi yang diberikan:
1. **`developer` / `instructions`** *(Otoritas Tertinggi)*: Arahan sistem dari pengembang aplikasi. Tidak dapat ditimpa oleh input pengguna.
2. **`user` / `input`** *(Tingkat Kedua)*: Konteks tugas atau pertanyaan pengguna.
3. **`assistant`** *(Tingkat Ketiga)*: Riwayat balasan model sebelumnya.

> 💡 **Best Practice Responses API**:  
> Selalu pisahkan instruksi sistem ke parameter `instructions` dan pertanyaan dinamis ke `input`.

### Jadwal Sunset Reusable Prompt Objects (`v1/prompts`)

| Tanggal | Tahapan | Implikasi bagi Developer |
| :--- | :--- | :--- |
| **3 Juni 2026** | *De-emphasized* | Pembuatan prompt object baru di API mulai didepresiasi. |
| **30 November 2026** | **Permanent Shutdown** | Endpoint `v1/prompts` dimatikan total. Request menggunakan `prompt_id` akan gagal. |

### Prinsip Version Prompts in Code:
- Simpan template prompt langsung di dalam repository kode aplikasi (Git), bukan di cloud prompt registry.
- Gunakan typed function builder atau schema untuk menyisipkan nilai dinamis.
- Terapkan review kode (Pull Request), unit testing, dan evaluasi CI/CD sebelum menerapkan perubahan prompt ke produksi.
- Rilis perubahan prompt menggunakan feature flag bertahap.
