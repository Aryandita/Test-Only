import 'dotenv/config';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

function parseHexColor(name, fallback = '#5865F2') {
  const raw = process.env[name] ?? fallback;
  const normalized = raw.trim().replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color for ${name}. Use format #RRGGBB`);
  }
  return Number.parseInt(normalized, 16);
}

export const env = {
  token: requireEnv('DISCORD_TOKEN'),
  clientId: requireEnv('DISCORD_CLIENT_ID'),
  guildId: process.env.DISCORD_GUILD_ID,
  ownerId: requireEnv('BOT_OWNER_ID'),
  prefix: process.env.PREFIX ?? '!',
  lavalink: {
    host: requireEnv('LAVALINK_HOST'),
    port: Number(process.env.LAVALINK_PORT ?? 2333),
    password: requireEnv('LAVALINK_PASSWORD'),
    secure: process.env.LAVALINK_SECURE === 'true'
  },
  geminiApiKey: requireEnv('GEMINI_API_KEY'),
  aiEmbedColor: parseHexColor('AI_EMBED_COLOR_HEX', '#00D2FF'),
  musicEmbedColor: parseHexColor('MUSIC_EMBED_COLOR_HEX', '#5865F2')
};
