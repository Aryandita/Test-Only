const PERSONA_MEMBER =
  'Jawab langsung ke inti dalam bahasa Indonesia, tanpa salam pembuka/penutup, tanpa menyebut model AI, tetap sopan dan ringkas.';
const PERSONA_OWNER =
  'Jawab langsung ke inti untuk kebutuhan owner bot, detail teknis bila perlu, tanpa salam, tanpa menyebut model AI.';

export class AIService {
  constructor(apiKey, ownerId) {
    this.ownerId = ownerId;
    this.apiKey = apiKey;
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
            maxOutputTokens: 700
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
    return text || 'Tidak ada jawaban yang bisa diberikan untuk prompt tersebut.';
  }
}
