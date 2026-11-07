# 01. Responses API Overview & Architecture

## 1. Definisi & Posisi Responses API

**Responses API** (`POST /v1/responses`) adalah *primitive* API terbaru dari OpenAI yang dirancang sebagai evolusi menyeluruh dari **Chat Completions** (`POST /v1/chat/completions`). 

Sementara Chat Completions masih tetap didukung untuk backward-compatibility, **Responses API menjadi standar yang direkomendasikan untuk seluruh proyek baru**.

> ⚠️ **Catatan Penting: Assistants API Sunset**  
> Mengacu pada masukan pengembang selama masa beta Assistants API, seluruh kapabilitas terbaik agen telah diintegrasikan langsung ke Responses API. **Assistants API resmi ditutup (*sunset*) pada 26 Agustus 2026**.

---

## 2. Keunggulan Utama (Key Benefits)

| Keunggulan | Penjelasan Teknis |
| :--- | :--- |
| **Kinerja Penalaran Unggul** | Pada model reasoning (seperti GPT-5, GPT-6), Responses API menghasilkan output penalaran lebih superior (+3% peningkatan pada SWE-bench dengan prompt & setup identik). |
| **Agentic Loop Terpasang** | Model secara otomatis dapat mengeksekusi multi-tool calls (`web_search`, `image_generation`, `file_search`, `code_interpreter`, MCP server jarak jauh, dan fungsi custom) dalam satu kali request API. |
| **Penghematan Biaya (Cache)** | Efisiensi pemanfaatan prompt cache melonjak antara **40% hingga 80%** dibanding Chat Completions. |
| **Stateful Context Otomatis** | Menggunakan parameter `store: true` untuk mempertahankan konteks percakapan, reasoning context, dan riwayat tools antar turn. |
| **Input yang Fleksibel** | Dapat menerima string input langsung atau array items; pemisahan eksplisit antara `instructions` (arahan sistem) dan `input`. |
| **Encrypted Reasoning (ZDR)** | Mendukung kepatuhan *Zero Data Retention* (ZDR) dengan enkripsi reasoning in-memory tanpa persistensi server. |
| **Masa Depan Model (Future-proof)** | Mulai model GPT-5.4 ke atas, Chat Completions tidak mendukung tool calling jika `reasoning_effort` diisi selain `"none"`. Model generasi baru dioptimalkan penuh pada Responses API. |

---

## 3. Matriks Perbandingan Kapabilitas

| Kapabilitas | Chat Completions API | Responses API |
| :--- | :---: | :---: |
| **Generasi Teks (Text generation)** | ✅ | ✅ |
| **Audio** | ❌ (Terbatas) | ⏳ *Coming soon* |
| **Visi / Gambar (Vision)** | ✅ | ✅ |
| **Structured Outputs** | ✅ (`response_format`) | ✅ (`text.format`) |
| **Function Calling** | ✅ (External schema) | ✅ (Internal schema + auto-strict) |
| **Web Search** | ❌ (Harus manual coding) | ✅ (Native Tool) |
| **File Search** | ❌ (Harus manual coding) | ✅ (Native Tool) |
| **Computer Use** | ❌ | ✅ (Native Tool) |
| **Code Interpreter** | ❌ (Harus manual coding) | ✅ (Native Tool) |
| **Remote MCP (Model Context Protocol)**| ❌ | ✅ (Native Connector) |
| **Generasi Gambar (Image generation)** | ❌ (Endpoint terpisah) | ✅ (Terintegrasi) |
| **Reasoning Summaries** | ❌ | ✅ |
| **Pilihan Generasi Ganda (`n`)** | ✅ (`n > 1`) | ❌ (Hanya 1 output per request) |

---

## 4. Konsep Fundamental: Messages vs. Items

Perbedaan arsitektur paling mendasar antara kedua API adalah unit representasi data:

```
[Chat Completions]
Request  : Array of Messages  [ { role: "system" }, { role: "user" } ]
Response : Array of Choices   [ { message: { content, role, tool_calls } } ]

[Responses API]
Request  : Top-level Instructions + Input (String / Array of Items)
Response : Response Object    -> output: Array of Typed Items
                                 ├── Item 1: type = "reasoning"
                                 ├── Item 2: type = "message" (role: assistant)
                                 └── Item 3: type = "function_call"
```

### Mengapa Konsep "Items" Lebih Unggul?
1. **Pemisahan Concern yang Jelas**: Pada Chat Completions, satu pesan sering menggabungkan teks, pemanggilan function, dan metadata sekaligus. Dalam Responses API, setiap unit aksi adalah satu `Item` tersendiri.
2. **Koleksi Tipe Item yang Variatif**:
   - `message` (input / output pengguna dan asisten)
   - `reasoning` (konten dan ringkasan penalaran model)
   - `function_call` (pemanggilan fungsi oleh model)
   - `function_call_output` (hasil balasan dari eksekusi fungsi di sisi client/server)
3. **Peniadaan Parameter `n`**: Responses API mengembalikan 1 generasi output deterministik per pemanggilan. Jika membutuhkan beberapa opsi kandidat, buat beberapa request terpisah.

---

## 5. Anatomi Payload Response

Objek balasan dari Responses API bersifat *strongly typed*:

```json
{
  "id": "resp_68af4030592c81938ec0a5fbab4a3e9f05438e46b5f69a3b",
  "object": "response",
  "created_at": 1756315696,
  "model": "gpt-6-astra",
  "output": [
    {
      "id": "rs_68af4030baa48193b0b43b4c2a176a1a05438e46b5f69a3b",
      "type": "reasoning",
      "content": [],
      "summary": []
    },
    {
      "id": "msg_68af40337e58819392e935fb404414d005438e46b5f69a3b",
      "type": "message",
      "status": "completed",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "annotations": [],
          "logprobs": [],
          "text": "Halo! Ada yang bisa saya bantu hari ini?"
        }
      ]
    }
  ]
}
```

> **Helper SDK `output_text`**:  
> Seluruh SDK resmi (Node.js, Python, Go, C#, Java, Ruby) menyediakan accessor helper (seperti `response.output_text` atau `response.OutputText()`) sehingga pengembang tidak perlu melakukan *unwrapping* array bertingkat saat hanya membutuhkan teks akhir.
