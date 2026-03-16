import { Client, GatewayIntentBits } from 'discord.js';
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

registerInteractionHandler(client, {
  env,
  aiService,
  musicManager,
  registerCommands
});

client.once('ready', async () => {
  console.log(`Login sebagai ${client.user.tag}`);
  const count = await registerCommands();
  console.log(`Command aktif: ${count}`);
});

client.login(env.token);
