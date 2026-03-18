/**
 * ⚠️  IMPORTANT: dotenv is loaded in index.js BEFORE this is imported
 * So process.env variables are already available here
 * DO NOT import 'dotenv/config' here - it's already done!
 */

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

function parseHexColor(rawHex, envName) {
  if (!rawHex) return null;

  const normalized = rawHex.toString().replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    console.warn(
      `⚠️ Nilai ${envName} tidak valid: "${rawHex}". Format yang benar: #RRGGBB. Default #5865F2 akan dipakai.`
    );
    return null;
  }

  return Number.parseInt(normalized, 16);
}

function resolveEmbedHex() {
  const aiHex = parseHexColor(process.env.AI_EMBED_COLOR_HEX, 'AI_EMBED_COLOR_HEX');
  if (aiHex !== null) return aiHex;

  const embedHex = parseHexColor(process.env.EMBED_HEX, 'EMBED_HEX');
  if (embedHex !== null) return embedHex;

  return 0x5865f2;
}

function resolveEmoji(envValue, defaultEmoji) {
  // Support format: <:name:id:> untuk custom emoji atau unicode emoji biasa
  if (!envValue) return defaultEmoji;
  
  const customEmojiMatch = envValue.match(/^<:[\w]+:\d+>$/);
  if (customEmojiMatch) return envValue; // Return custom emoji as-is
  
  // Assume it's a unicode emoji
  if (envValue.length > 0) return envValue;
  
  return defaultEmoji;
}

export const env = {
  token: requireEnv('DISCORD_TOKEN'),
  clientId: requireEnv('DISCORD_CLIENT_ID'),
  guildId: process.env.DISCORD_GUILD_ID,
  ownerId: requireEnv('BOT_OWNER_ID'),
  prefix: process.env.BOT_PREFIX ?? '!',
  embedHex: resolveEmbedHex(),
  botStatus: (process.env.BOT_STATUS ?? 'online').toLowerCase(),
  botActivityType: (process.env.BOT_ACTIVITY_TYPE ?? 'playing').toLowerCase(),
  botActivityText: process.env.BOT_ACTIVITY_TEXT ?? '!help | Music & Mini Games',
  defaultLanguage: (process.env.BOT_LANGUAGE ?? 'id').toLowerCase(), // 🌍 Default: Indonesian
  lavalink: {
    host: requireEnv('LAVALINK_HOST'),
    port: Number(process.env.LAVALINK_PORT ?? 2333),
    password: requireEnv('LAVALINK_PASSWORD'),
    secure: process.env.LAVALINK_SECURE === 'true'
  },
  geminiApiKey: requireEnv('GEMINI_API_KEY'),
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/discord-bot',
  // Music Control Emojis (support format: <:name:id:> atau unicode emoji)
  emojis: {
    skip: resolveEmoji(process.env.EMOJI_SKIP, '⏭️'),
    loop: resolveEmoji(process.env.EMOJI_LOOP, '🔁'),
    autoplay: resolveEmoji(process.env.EMOJI_AUTOPLAY, '♾️'),
    stop: resolveEmoji(process.env.EMOJI_STOP, '⏹️'),
    lyrics: resolveEmoji(process.env.EMOJI_LYRICS, '📝'),
    playing: resolveEmoji(process.env.EMOJI_PLAYING, '▶️'),
    paused: resolveEmoji(process.env.EMOJI_PAUSED, '⏸️'),
    queue: resolveEmoji(process.env.EMOJI_QUEUE, '📋'),
    volume: resolveEmoji(process.env.EMOJI_VOLUME, '🔊'),
    success: resolveEmoji(process.env.EMOJI_SUCCESS, '✅'),
    error: resolveEmoji(process.env.EMOJI_ERROR, '❌')
  }
};
