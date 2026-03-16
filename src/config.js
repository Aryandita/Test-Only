import dotenv from 'dotenv';

dotenv.config();

const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GEMINI_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  ownerIds: (process.env.OWNER_IDS ?? '').split(',').map((v) => v.trim()).filter(Boolean),
  geminiApiKey: process.env.GEMINI_API_KEY,
  lavalink: {
    host: process.env.LAVALINK_HOST ?? '127.0.0.1',
    port: Number(process.env.LAVALINK_PORT ?? 2333),
    auth: process.env.LAVALINK_PASSWORD ?? 'youshallnotpass',
    secure: (process.env.LAVALINK_SECURE ?? 'false') === 'true'
  }
};
