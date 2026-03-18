import { EmbedBuilder } from 'discord.js';

const PERSONA_MEMBER =
  'Jawab langsung ke inti dalam bahasa Indonesia, tanpa salam pembuka/penutup, tanpa menyebut model AI, tetap sopan dan ringkas. Fokus pada konten yang berguna dan jelas.';
const PERSONA_OWNER =
  'Jawab langsung ke inti untuk kebutuhan owner bot, detail teknis bila perlu, tanpa salam, tanpa menyebut model AI. Sediakan informasi komprehensif dan actionable.';

export class AIService {
  constructor(apiKey, ownerId, embedHex = 0x5865f2) {
    this.ownerId = ownerId;
    this.apiKey = apiKey;
    this.embedHex = embedHex;
  }

  async ask({ userId, prompt, history = [] }) {
    const systemInstruction = userId === this.ownerId ? PERSONA_OWNER : PERSONA_MEMBER;

    const historyText = history.length
      ? history.map((item) => `${item.role === 'assistant' ? 'Assistant' : 'User'}: ${item.text}`).join('\n')
      : '';

    const finalPrompt = historyText
      ? `Riwayat percakapan:\n${historyText}\n\nPesan terbaru user:\n${prompt}`
      : prompt;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
          generationConfig: {
            temperature: userId === this.ownerId ? 0.6 : 0.7,
            maxOutputTokens: 2000
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const answer = text || '⚠️ Tidak bisa memberikan jawaban. Coba pertanyaan yang berbeda.';

    // Return text for history tracking
    return answer;
  }

  /**
   * Buat embed untuk jawaban AI dengan warna hex yang stabil dari env
   * @param {string} answer - Teks jawaban dari AI
   * @returns {EmbedBuilder} Discord embed dengan warna dari env.embedHex
   */
  createAnswerEmbed(answer) {
    return new EmbedBuilder()
      .setColor(this.embedHex)
      .setTitle('💡 Jawaban')
      .setDescription(answer.slice(0, 4000))
      .setFooter({ text: '🤖 Powered by Gemini AI' });
  }
}
