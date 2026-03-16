const PERSONA_MEMBER = `Kamu adalah asisten Discord yang ramah, singkat, helpful, dan aman. Gunakan bahasa Indonesia santai namun sopan.`;
const PERSONA_OWNER = `Kamu adalah asisten private untuk owner bot. Jawaban harus detail, fokus operasional bot, troubleshooting teknis, dan prioritas keamanan.`;

export class AIService {
  constructor(apiKey, ownerId) {
    this.ownerId = ownerId;
    this.apiKey = apiKey;
  }

  async ask({ userId, prompt }) {
    const systemInstruction = userId === this.ownerId ? PERSONA_OWNER : PERSONA_MEMBER;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: userId === this.ownerId ? 0.6 : 0.8,
            maxOutputTokens: 600
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Tidak ada jawaban dari Gemini.';
  }
}
