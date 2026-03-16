import { executeBotCommand } from '../commands/handlers.js';

const PREFIX_COMMAND_MAP = new Map([
  ['play', 'play'],
  ['skip', 'skip'],
  ['stop', 'stop'],
  ['queue', 'queue'],
  ['loop', 'loop'],
  ['ai', 'ai'],
  ['restart', 'restart'],
  ['ownerstats', 'owner-stats'],
  ['ownersync', 'owner-sync']
]);

export function registerPrefixHandler(client, context) {
  const { env } = context;

  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.content.startsWith(env.prefix)) {
      return;
    }

    const raw = message.content.slice(env.prefix.length).trim();
    if (!raw) return;

    const [inputCommand, ...args] = raw.split(/\s+/);
    const normalizedCommand = PREFIX_COMMAND_MAP.get(inputCommand.toLowerCase());

    if (!normalizedCommand) return;

    try {
      await executeBotCommand({
        command: normalizedCommand,
        options: {
          query: args.join(' '),
          prompt: args.join(' ')
        },
        userId: message.author.id,
        member: message.member,
        guild: message.guild,
        guildId: message.guildId,
        channelId: message.channelId,
        client,
        respond: (payload) => message.reply(payload),
        context
      });

      console.log(`✅ Prefix command ${env.prefix}${inputCommand} sukses oleh ${message.author.tag}`);
    } catch (error) {
      console.error(`❌ Prefix command ${env.prefix}${inputCommand} gagal:`, error);
      await message.reply(`Terjadi error: ${error.message}`);
    }
  });
}
