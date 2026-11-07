import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY?.trim() || '';
const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let openAiInstance = null;

export const isOpenAiConfigured = () => {
  return Boolean(apiKey) && !apiKey.includes('placeholder') && apiKey.startsWith('sk-');
};

export const getOpenAiClient = () => {
  if (!openAiInstance) {
    if (!apiKey) {
      // Inisialisasi client fallback untuk testing / dev agar tidak throw fatal error saat startup
      openAiInstance = new OpenAI({
        apiKey: 'sk-placeholder-key-for-development-and-testing',
      });
    } else {
      openAiInstance = new OpenAI({
        apiKey,
      });
    }
  }
  return openAiInstance;
};

export const openaiService = {
  /**
   * Cek status koneksi dan konfigurasi OpenAI
   */
  getStatus() {
    return {
      service: 'OpenAI',
      configured: isOpenAiConfigured(),
      model: defaultModel,
      hasKey: Boolean(apiKey),
    };
  },

  /**
   * Kirim pesan / prompt ke OpenAI Chat Completions
   */
  async chat({ message, prompt, model = defaultModel }) {
    const userContent = message || prompt;

    if (!userContent || typeof userContent !== 'string') {
      const error = new Error('Field "message" atau "prompt" wajib diisi dengan teks valid');
      error.status = 400;
      throw error;
    }

    if (!isOpenAiConfigured()) {
      return {
        source: 'mock-fallback',
        model,
        response: `[Simulasi OpenAI - Kunci API Belum Dikonfigurasi]: Anda mengirimkan: "${userContent}". Untuk mendapatkan respon dari OpenAI sungguhan, masukkan OPENAI_API_KEY Anda di file backend/.env.`,
        configured: false,
      };
    }

    try {
      const client = getOpenAiClient();
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'Anda adalah asisten AI ramah dan profesional untuk platform Teralio.',
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
      });

      return {
        source: 'openai',
        model,
        response: completion.choices[0]?.message?.content || '',
        configured: true,
      };
    } catch (err) {
      console.error('[OpenAiService] Error upstream:', err.message);
      const error = new Error(`OpenAI Upstream Error: ${err.message}`);
      error.status = err.status || 502;
      throw error;
    }
  },
};
