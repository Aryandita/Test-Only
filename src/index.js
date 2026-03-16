import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { registerPrefixHandler } from './events/message-create.js';
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

const context = {
  env,
  aiService,
  musicManager,
  registerCommands
};

registerInteractionHandler(client, context);
registerPrefixHandler(client, context);

client.once('ready', async () => {
  console.log(`🚀 Login sebagai ${client.user.tag}`);
  const count = await registerCommands();
  console.log(`✅ Slash command aktif: ${count}`);
  console.log(`🎯 Prefix command aktif: ${env.prefix} (contoh: ${env.prefix}play yoasobi)`);
});

client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

client.login(env.token).catch((error) => {
  console.error('🔴 Gagal login ke Discord:', error);
  process.exit(1);
});
