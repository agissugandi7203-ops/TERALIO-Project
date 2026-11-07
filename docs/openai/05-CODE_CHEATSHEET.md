# 05. Cheatsheet & Komparasi Kode Lintas Bahasa

Cheatsheet ini memuat perbandingan sintaks langsung antara **Chat Completions** vs **Responses API** vs **Decisions API** dalam berbagai bahasa pemrograman populer.

---

## 1. JavaScript / TypeScript (Node.js SDK)

### Generasi Teks Sederhana
```javascript
import OpenAI from "openai";
const client = new OpenAI();

// Chat Completions (Lama)
const resOld = await client.chat.completions.create({
  model: "gpt-6-astra",
  messages: [{ role: "user", content: "Halo!" }]
});
console.log(resOld.choices[0].message.content);

// Responses API (Modern)
const resNew = await client.responses.create({
  model: "gpt-6-astra",
  instructions: "Anda adalah asisten AI.",
  input: "Halo!"
});
console.log(resNew.output_text);
```

### Structured Outputs (JSON Schema)
```javascript
// Responses API
const structured = await client.responses.create({
  model: "gpt-6-astra",
  input: "Jane Doe, usia 28 tahun",
  text: {
    format: {
      type: "json_schema",
      name: "profil_pengguna",
      strict: true,
      schema: {
        type: "object",
        properties: {
          nama: { type: "string" },
          usia: { type: "number" }
        },
        required: ["nama", "usia"],
        additionalProperties: false
      }
    }
  }
});
console.log(structured.output_text);
```

### Menggunakan Native Web Search Tool
```javascript
const searchAnswer = await client.responses.create({
  model: "gpt-6-astra",
  input: "Siapa presiden Prancis saat ini?",
  tools: [{ type: "web_search" }]
});
console.log(searchAnswer.output_text);
```

---

## 2. Python (Official SDK)

### Multi-turn Conversation (`previous_response_id`)
```python
from openai import OpenAI
client = OpenAI()

# Turn 1
res1 = client.responses.create(
    model="gpt-6-astra",
    instructions="Anda adalah asisten ringkas.",
    input="Berapa jarak bumi ke bulan?",
    store=True
)
print("Turn 1:", res1.output_text)

# Turn 2 (Menyambung turn 1 secara otomatis)
res2 = client.responses.create(
    model="gpt-6-astra",
    instructions="Anda adalah asisten ringkas.", # Resend instructions!
    input="Berapa lama waktu tempuh cahaya ke sana?",
    previous_response_id=res1.id,
    store=True
)
print("Turn 2:", res2.output_text)
```

### Decisions API: Predicate & Choice
```python
# Evaluasi cepat dengan Decisions API
decision = client.decisions.create(
    model="gpt-6-luna",
    input="Saya memesan ukuran XL namun barang yang datang adalah ukuran S.",
    questions=[
        {
            "type": "choice",
            "name": "jenis_keluhan",
            "instructions": "Pilih jenis kendala pelanggan:",
            "choices": [
                {"value": "salah_kirim", "description": "Barang tidak sesuai pesanan"},
                {"value": "rusak", "description": "Barang cacat fisik"},
                {"value": "lama", "description": "Pengiriman terlambat"}
            ]
        },
        {
            "type": "predicate",
            "name": "butuh_refund",
            "instructions": "Apakah masalah ini membutuhkan penggantian barang/refund?"
        }
    ]
)

for ans in decision.answers:
    print(ans.name, "->", ans)
```

---

## 3. Go (`openai-go/v3`)

### Responses API (Generasi Teks & Helper Output)
```go
package main

import (
	"context"
	"fmt"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/responses"
)

func main() {
	client := openai.NewClient()

	res, err := client.Responses.New(context.Background(), responses.ResponseNewParams{
		Model:        "gpt-6-astra",
		Instructions: openai.String("Anda adalah asisten pemrograman."),
		Input:        responses.ResponseNewParamsInputUnion{OfString: openai.String("Buatkan fungsi fibonacci di Go.")},
	})
	if err != nil {
		panic(err)
	}

	fmt.Println(res.OutputText())
}
```

---

## 4. cURL / Raw HTTP Endpoint

### Request Responses API Biasa
```bash
curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-6-astra",
    "instructions": "Jawab dalam bahasa Indonesia santun.",
    "input": "Halo OpenAI!"
  }'
```

### Request Responses API dengan Native Web Search
```bash
curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-6-astra",
    "input": "Berapa kurs USD ke IDR hari ini?",
    "tools": [{"type": "web_search"}]
  }'
```

### Request Decisions API (Evaluasi Cepat `gpt-6-luna`)
```bash
curl https://api.openai.com/v1/decisions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-6-luna",
    "input": "Pengiriman tiba dalam 1 hari, barang terbungkus sangat rapi dan mulus.",
    "questions": [
      {
        "type": "choice",
        "name": "sentimen",
        "instructions": "Tentukan sentimen ulasan pembeli:",
        "choices": [
          {"value": "positif", "description": "Puas dan memuji layanan"},
          {"value": "netral", "description": "Biasa saja tanpa emosi"},
          {"value": "negatif", "description": "Kecewa atau komplain"}
        ]
      },
      {
        "type": "score",
        "name": "bintang_rating",
        "instructions": "Berapa rating estimasi untuk ulasan ini?",
        "levels": [
          {"label": "1 Bintang", "description": "Sangat buruk"},
          {"label": "3 Bintang", "description": "Cukup"},
          {"label": "5 Bintang", "description": "Sempurna"}
        ]
      }
    ]
  }'
```
