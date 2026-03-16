import { GoogleGenAI } from '@google/genai';

const OWNER_PERSONA = `Kamu adalah asisten owner bot Discord.
Gaya bicara: ringkas, strategis, teknis, dan proaktif.
Saat diminta konfigurasi/diagnosa, berikan langkah jelas + risiko.
Jangan membocorkan data sensitif seperti token.`;

const MEMBER_PERSONA = `Kamu adalah asisten ramah untuk member server Discord.
Gaya bicara: sopan, santai, singkat, mudah dipahami.
Hindari info internal owner atau sistem yang sensitif.`;

export class AiService {
  constructor(apiKey) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async ask({ prompt, isOwner, username }) {
    const persona = isOwner ? OWNER_PERSONA : MEMBER_PERSONA;

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${persona}\n\nNama pengguna: ${username}\nPertanyaan: ${prompt}`
            }
          ]
        }
      ]
    });

    return response.text ?? 'Maaf, saya tidak mendapat jawaban dari Gemini saat ini.';
  }
}
