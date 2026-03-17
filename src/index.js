import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { AIService } from './services/ai-service.js';
import { MusicManager } from './services/music-manager.js';
import { registerInteractionHandler } from './events/interaction-create.js';
import { deployCommands } from './deploy-commands.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const aiService = new AIService(env.geminiApiKey, env.ownerId);
const musicManager = new MusicManager(client, env);

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
  registerCommands
});

client.once('ready', async () => {
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
