# 12. Transkripsi File Audio (GPT-Transcribe)

Dokumentasi ini merangkum kapabilitas transkripsi file audio OpenAI menggunakan model generasi terbaru **`gpt-transcribe`**, manajemen konteks/keyword, diarization pembicara, pemotongan file besar (>25MB), transkripsi streaming, serta batas waktu penghentian (*sunset*) model-model lawas.

---

## 1. Ringkasan & Model Standar

Untuk file rekaman yang sudah selesai (*completed audio file*), gunakan endpoint:
`POST /v1/audio/transcriptions` dengan model **`gpt-transcribe`**.

| Atribut | Ketentuan Teknis |
| :--- | :--- |
| **Model Rekomendasi** | `gpt-transcribe` (transkripsi bahasa asli dengan akurasi tertinggi) |
| **Batas Ukuran File** | Maksimal **25 MB** per request |
| **Format yang Didukung** | `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, `webm` |
| **Audio Streaming Masuk** | Untuk mikrofon langsung / media streaming, gunakan *Realtime Transcription* |

> ⚠️ **Pemberitahuan Depresiasi Penting: 26 Februari 2027**  
> Model-model berikut dinyatakan usang (*deprecated*) dan akan dimatikan sepenuhnya pada **26 Februari 2027**:  
> - `whisper-1`  
> - `gpt-4o-transcribe`  
> - `gpt-4o-mini-transcribe`  
> - `gpt-4o-transcribe-diarize`  
> - Endpoint terjemahan lawas: `POST /v1/audio/translations`  
> 
> *Solusi masa depan:* Gunakan `gpt-transcribe` untuk transkripsi, lalu teruskan hasilnya ke model teks (Responses API) jika memerlukan penerjemahan (*translation*) atau post-processing.

---

## 2. Quickstart Transkripsi Dasar

### JavaScript / TypeScript
```javascript
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream("rekaman.wav"),
  model: "gpt-transcribe",
});

console.log("Hasil Transkripsi:", transcription.text);
```

### Python
```python
from openai import OpenAI

client = OpenAI()

with open("rekaman.wav", "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        model="gpt-transcribe",
        file=audio_file,
    )

print("Hasil Transkripsi:", transcription.text)
```

---

## 3. Meningkatkan Akurasi dengan Konteks & Keywords

Model `gpt-transcribe` menyediakan parameter opsional untuk meningkatkan pengenalan istilah medis, teknis, atau singkatan khusus:

1. **`prompt`**: Memberikan konteks gaya bahasa umum, topik pembicaraan, atau daftar nama pembicara.
2. **`keywords`**: Array kata kunci spesifik yang harus dicocokkan secara literal (misal: nama merek dagang, terminologi industri, atau akronim).
3. **`languages`**: Kode bahasa ISO (misal: `["id"]` untuk Bahasa Indonesia, `["en"]` untuk Bahasa Inggris, atau regional `["zh"]`).

```python
with open("diskusi_teknis.wav", "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        model="gpt-transcribe",
        file=audio_file,
        prompt="Diskusi arsitektur database Teralio antara Tech Lead dan Developer.",
        extra_body={
            "keywords": ["Teralio", "Supabase", "PostgreSQL", "RLS", "Next.js"],
            "languages": ["id", "en"]
        }
    )
```

---

## 4. Speaker Diarization (Identifikasi Siapa Berbicara)

Untuk mengidentifikasi segmen pembicara pada rekaman rapat atau panggilan telepon, integrasi yang ada saat ini dapat memanfaatkan `gpt-4o-transcribe-diarize` (hingga 26 Februari 2027).

### Mekanisme Diarization:
- Format output: `response_format: "diarized_json"`.
- Setiap segmen mengembalikan properti: `speaker`, `text`, `start`, dan `end` (dalam detik).
- Untuk audio > 30 detik, sertakan `chunking_strategy: "auto"`.
- Opsional: Berikan hingga 4 contoh audio referensi (2-10 detik) dengan `known_speaker_names` dan `known_speaker_references` (format Data URL base64) untuk memetakan nama pembicara yang sudah dikenal.

```python
import base64
from openai import OpenAI

client = OpenAI()

def to_data_url(path: str) -> str:
    with open(path, "rb") as fh:
        return "data:audio/wav;base64," + base64.b64encode(fh.read()).decode("utf-8")

with open("meeting.wav", "rb") as audio_file:
    transcript = client.audio.transcriptions.create(
        model="gpt-4o-transcribe-diarize",
        file=audio_file,
        response_format="diarized_json",
        chunking_strategy="auto",
        extra_body={
            "known_speaker_names": ["Customer", "SupportAgent"],
            "known_speaker_references": [
                to_data_url("sample_customer.wav"),
                to_data_url("sample_agent.wav")
            ]
        }
    )

for segment in transcript.segments:
    if "speaker" in segment:
        print(f"[{segment.start:.2f}s - {segment.end:.2f}s] {segment.speaker}: {segment.text}")
```

---

## 5. Menangani File Audio Panjang (>25 MB) dengan Chunking

Karena batas maksimum endpoint adalah 25MB, file berdurasi panjang harus dipotong menjadi beberapa bagian menggunakan library seperti **PyDub**, lalu digabungkan kembali:

```python
from pydub import AudioSegment
from openai import OpenAI
import math

client = OpenAI()

def transcribe_large_audio(file_path: str):
    audio = AudioSegment.from_file(file_path)
    
    # Potong per 10 menit (600,000 ms)
    ten_minutes = 10 * 60 * 1000
    total_chunks = math.ceil(len(audio) / ten_minutes)
    
    full_transcript = []
    
    for i in range(total_chunks):
        start = i * ten_minutes
        end = min((i + 1) * ten_minutes, len(audio))
        chunk = audio[start:end]
        
        chunk_file = f"temp_chunk_{i}.mp3"
        chunk.export(chunk_file, format="mp3")
        
        with open(chunk_file, "rb") as f:
            res = client.audio.transcriptions.create(
                model="gpt-transcribe",
                file=f
            )
            full_transcript.append(res.text)
            
    return " ".join(full_transcript)
```

---

## 6. Transkripsi File Berbasis Streaming

Saat mentranskrip file besar atau file rekaman yang baru selesai diunggah, aktifkan `stream=true` agar UI pengguna menampilkan teks delta secara langsung:

```javascript
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

const stream = await openai.audio.transcriptions.create({
  file: fs.createReadStream("audio_panjang.wav"),
  model: "gpt-transcribe",
  stream: true,
});

for await (const chunk of stream) {
  if (chunk.type === "transcript.text.delta") {
    process.stdout.write(chunk.delta);
  }
}
```

---

## 7. Post-Processing & Terjemahan dengan Responses API

Sebagai pengganti endpoint `/v1/audio/translations` yang akan dimatikan, alur kerja standar modern adalah mengambil transkrip asli dari `gpt-transcribe`, lalu meneruskannya ke **Responses API** untuk:
1. Memperbaiki tanda baca, kapitalisasi, dan format paragraf.
2. Menerjemahkan ke bahasa sasaran dengan nuansa konteks yang kaya.
3. Mengekstrak poin rapat (*action items*).

```python
# Langkah 1: Transkripsi audio lokal
transcription = client.audio.transcriptions.create(
    model="gpt-transcribe",
    file=open("interview_jepang.mp3", "rb")
)

# Langkah 2: Terjemahkan dan ringkas via Responses API
response = client.responses.create(
    model="gpt-6-astra",
    instructions="Terjemahkan transkrip percakapan berikut ke Bahasa Indonesia formal dan susun poin-poin utamanya.",
    input=transcription.text
)

print(response.output_text)
```
