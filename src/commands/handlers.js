import { EmbedBuilder, MessageFlags } from 'discord.js';
import { createAiV2EmbedLike, createNowPlayingComponents, formatQueue } from '../utils/music-ui.js';

function ownerOnly(userId, ownerId) {
  return userId === ownerId;
}

function isOwnerGuard(userId, env) {
  return ownerOnly(userId, env.ownerId);
}

export async function handleCommand(interaction, context) {
  const command = interaction.commandName;
  const args = {
    query: interaction.options.getString('query'),
    prompt: interaction.options.getString('prompt')
  };

  await runCommand({
    command,
    args,
    context,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    userId: interaction.user.id,
    member: interaction.member,
    shardId: interaction.guild?.shardId,
    reply: async (payload) => interaction.reply(payload),
    deferReply: async (payload) => interaction.deferReply(payload),
    editReply: async (payload) => interaction.editReply(payload)
  });
}

export async function handlePrefixCommand(message, context) {
  const { env } = context;
  if (message.author.bot || !message.content.startsWith(env.prefix)) return;

  const [rawCommand, ...rest] = message.content.slice(env.prefix.length).trim().split(/\s+/);
  const command = (rawCommand ?? '').toLowerCase();
  if (!command) return;

  const payload = {
    command,
    args: {
      query: rest.join(' ').trim(),
      prompt: rest.join(' ').trim()
    },
    context,
    guildId: message.guildId,
    channelId: message.channelId,
    userId: message.author.id,
    member: message.member,
    shardId: message.guild?.shardId,
    reply: async (body) => message.reply(normalizePrefixPayload(body)),
    deferReply: async () => {},
    editReply: async (body) => message.reply(normalizePrefixPayload(body))
  };

  try {
    await runCommand(payload);
  } catch (error) {
    await message.reply(`❌ Error prefix command: ${error.message}`);
  }
}

function normalizePrefixPayload(body) {
  if (typeof body === 'string') return { content: body };
  const { ephemeral, flags, ...rest } = body;
  return rest;
}

async function runCommand(input) {
  const { command, args, context, guildId, channelId, userId, member, shardId, reply, deferReply, editReply } = input;
  const { musicManager, aiService, env, registerCommands } = context;

  switch (command) {
    case 'play': {
      const query = args.query?.trim();
      const voiceChannel = member?.voice?.channel;

      if (!query) {
        await reply({ content: '🎧 Masukkan query. Contoh: `/play query:unity` atau `!play unity`', ephemeral: true });
        return;
      }

      if (!voiceChannel) {
        await reply({ content: '🚫 Kamu harus masuk voice channel dulu.', ephemeral: true });
        return;
      }

      await deferReply();
      const track = await musicManager.search(query);
      if (!track) {
        await editReply('🔎 Lagu tidak ditemukan. Coba keyword lain ya.');
        return;
      }

      if (!musicManager.shoukaku.players.has(guildId)) {
        await musicManager.join({ guildId, voiceChannelId: voiceChannel.id, shardId });
      }

      const queue = await musicManager.enqueue({ guildId, track, textChannelId: channelId });
      await editReply(createNowPlayingComponents(queue.current ?? track, queue.loop));
      return;
    }

    case 'skip': {
      await deferReply({ flags: MessageFlags.Ephemeral });
      const track = await musicManager.skip(guildId);
      await editReply(track ? `⏭️ Skip berhasil. Lanjut: **${track.info.title}**` : '📭 Antrian habis.');
      return;
    }

    case 'stop': {
      await musicManager.stop(guildId);
      await reply({ content: '🛑 Musik dihentikan dan bot keluar voice channel.' });
      return;
    }

    case 'queue': {
      const queue = musicManager.getQueue(guildId);
      const embed = new EmbedBuilder()
        .setColor(env.embedHex)
        .setTitle('📜 Daftar Antrian Musik')
        .setDescription(formatQueue(queue));
      await reply({ embeds: [embed] });
      return;
    }

    case 'loop': {
      const enabled = musicManager.toggleLoop(guildId);
      await reply({ content: `🔁 Loop sekarang: **${enabled ? 'Aktif ✅' : 'Mati ❌'}**` });
      return;
    }

    case 'ai': {
      const prompt = args.prompt?.trim();
      if (!prompt) {
        await reply({ content: '💬 Masukkan prompt. Contoh: `!ai jelaskan cara setup lavalink`', ephemeral: true });
        return;
      }

      await deferReply();
      const answer = await aiService.ask({ userId, prompt });
      const safeText = answer.slice(0, 3800);
      const hexLabel = `#${env.embedHex.toString(16).padStart(6, '0').toUpperCase()}`;
      await editReply(
        createAiV2EmbedLike({
          title: '🤖 AI Assistant (Gemini 2.5 Flash)',
          description: safeText,
          hexLabel
        })
      );
      return;
    }

    case 'restart': {
      if (!isOwnerGuard(userId, env)) {
        await reply({ content: '🔒 Command ini hanya untuk owner.', ephemeral: true });
        return;
      }

      await reply('♻️ Bot akan restart sekarang...');
      setTimeout(() => process.exit(0), 1_000);
      return;
    }

    case 'owner-stats': {
      if (!isOwnerGuard(userId, env)) {
        await reply({ content: '🔒 Command ini hanya untuk owner.', ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(env.embedHex)
        .setTitle('👑 Owner Control Panel')
        .setDescription('Statistik runtime bot saat ini.')
        .addFields(
          { name: '🏠 Guild', value: `${context.client.guilds.cache.size}`, inline: true },
          { name: '📶 Ping', value: `${context.client.ws.ping} ms`, inline: true },
          { name: '⏱️ Uptime', value: `${Math.floor(process.uptime())} detik`, inline: true }
        );

      await reply({ embeds: [embed], ephemeral: true });
      return;
    }

    case 'owner-sync': {
      if (!isOwnerGuard(userId, env)) {
        await reply({ content: '🔒 Command ini hanya untuk owner.', ephemeral: true });
        return;
      }

      await deferReply({ ephemeral: true });
      const count = await registerCommands();
      await editReply(`✅ Sinkronisasi slash command selesai. Total command: **${count}**.`);
      return;
    }

    case 'help': {
      await reply(
        `📚 **Command tersedia**\n${env.prefix}play <query>\n${env.prefix}skip\n${env.prefix}stop\n${env.prefix}queue\n${env.prefix}loop\n${env.prefix}ai <prompt>\n${env.prefix}help`
      );
      return;
    }

    default:
      await reply({ content: `❓ Command '${command}' belum tersedia. Coba '${env.prefix}help'.` });
  }
}
