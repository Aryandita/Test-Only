import 'dotenv/config';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

export const env = {
  token: requireEnv('DISCORD_TOKEN'),
  clientId: requireEnv('DISCORD_CLIENT_ID'),
  guildId: process.env.DISCORD_GUILD_ID,
  ownerId: requireEnv('BOT_OWNER_ID'),
  lavalink: {
    host: requireEnv('LAVALINK_HOST'),
    port: Number(process.env.LAVALINK_PORT ?? 2333),
    password: requireEnv('LAVALINK_PASSWORD'),
    secure: process.env.LAVALINK_SECURE === 'true'
  },
  geminiApiKey: requireEnv('GEMINI_API_KEY')
};
