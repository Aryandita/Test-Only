/**
 * 🔥 MAIN BOT ENTRY POINT
 * 
 * FLOW:
 * 1. LOAD DOTENV FIRST (before any imports that use process.env)
 * 2. Bootstrap initialization (validate dependencies + env vars)
 * 3. Load all Discord.js modules
 * 4. Initialize services
 * 5. Startup bot
 */

// ⚠️  CRITICAL: Load dotenv IMMEDIATELY before any other imports
// This ensures all process.env variables are available
import 'dotenv/config';

import { initializeBootstrap } from './bootstrap.js';

// Initialize bootstrap FIRST (validate dependencies & env vars)
await initializeBootstrap().catch(error => {
  console.error('\n❌ Bootstrap failed! Bot cannot start.\n');
  process.exit(1);
});

// After bootstrap succeed, import everything else
import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { AIService } from './services/ai-service.js';
import { MusicManager } from './services/music-manager.js';
import EconomyService from './services/economy-service.js';
import greetingService from './services/greeting-service.js';
import boostService from './services/boost-service.js';
import tempVoiceService from './services/temp-voice-service.js';
import { connect as connectDB } from './database/db.js';
import { registerInteractionHandler } from './events/interaction-create.js';
import { deployCommands } from './deploy-commands.js';
import { createMusicControlComponents, createNowPlayingEmbed, createStatusEmbed } from './utils/music-ui.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const aiService = new AIService(env.geminiApiKey, env.ownerId, env.embedHex);
const musicManager = new MusicManager(client, env);
const musicLevellingService = new MusicLevellingService();

musicManager.setTrackStartNotifier(async ({ guildId, track, queue, isAutoTransition }) => {
  if (!isAutoTransition || !queue.textChannelId) return;
  const channel = await client.channels.fetch(queue.textChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  const embed = createNowPlayingEmbed({
    track,
    loopEnabled: queue.loop,
    autoplayEnabled: queue.autoplay,
    color: env.embedHex
  });

  await channel.send({ embeds: [embed], components: createMusicControlComponents(queue.autoplay, queue.twentyfourseven, env) }).catch(() => null);
});

musicManager.setQueueEndNotifier(async ({ queue }) => {
  if (!queue.textChannelId) return;
  const channel = await client.channels.fetch(queue.textChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  await channel
    .send({
      embeds: [
        createStatusEmbed({
          color: env.embedHex,
          title: '✅ Musik Selesai',
          description: 'Antrian telah habis. Tambahkan lagu baru untuk memulai lagi.'
        })
      ]
    })
    .catch(() => null);
});

musicManager.setAutoplaySearchingNotifier(async ({ queue }) => {
  if (!queue.textChannelId) return;
  const channel = await client.channels.fetch(queue.textChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  await channel
    .send({
      embeds: [
        createStatusEmbed({
          color: env.embedHex,
          title: '🔎 Mencari Lagu Selanjutnya',
          description: 'Autoplay sedang mencari lagu dengan artis/tema serupa...'
        })
      ]
    })
    .catch(() => null);
});

async function registerCommands() {
  return deployCommands();
}

function resolveActivityType(type) {
  const mapping = {
    playing: ActivityType.Playing,
    listening: ActivityType.Listening,
    watching: ActivityType.Watching,
    competing: ActivityType.Competing
  };

  return mapping[type] ?? ActivityType.Playing;
}

function resolveStatus(status) {
  const allowed = new Set(['online', 'idle', 'dnd', 'invisible']);
  return allowed.has(status) ? status : 'online';
}

registerInteractionHandler(client, {
  client,
  env,
  aiService,
  musicManager,
  economyService: EconomyService,
  greetingService,
  boostService,
  tempVoiceService,
  registerCommands
});

client.once('ready', async () => {
  // Connect to MongoDB
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.warn('⚠️ Bot berjalan tanpa database. Fitur ekonomi tidak tersedia.');
  }

  client.user.setPresence({
    status: resolveStatus(env.botStatus),
    activities: [{ name: env.botActivityText, type: resolveActivityType(env.botActivityType) }]
  });

  console.log(`✅🤖 Login sebagai ${client.user.tag}`);
  console.log(`🟢 Status bot: ${resolveStatus(env.botStatus)} | Activity: ${env.botActivityType} ${env.botActivityText}`);
  console.log(`ℹ️ Prefix command aktif: ${env.prefix}`);
  const count = await registerCommands();
  console.log(`✅ Slash command aktif: ${count}`);
});

client.on('error', (error) => {
  console.error(`❌ Discord client error: ${error.message}`);
});

client.login(env.token).catch((error) => {
  console.error(`❌ Gagal login Discord: ${error.message}`);
  process.exit(1);
});
