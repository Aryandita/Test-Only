import { EmbedBuilder, MessageFlags } from 'discord.js';
import { createAIResponseComponents, createNowPlayingComponents, formatQueue } from '../utils/music-ui.js';

function ownerOnly(userId, ownerId) {
  return userId === ownerId;
}

export async function executeBotCommand({
  command,
  options = {},
  userId,
  member,
  guild,
  guildId,
  channelId,
  client,
  respond,
  context
}) {
  const { musicManager, aiService, env, registerCommands } = context;

  switch (command) {
    case 'play': {
      const query = options.query;
      if (!query?.trim()) {
        await respond({ content: '⚠️ Masukkan query lagu. Contoh: `/play query:night dancer` atau `!play night dancer`.' });
        return;
      }
      const voiceChannel = member?.voice?.channel;

      if (!voiceChannel) {
        await respond({ content: '⚠️ Kamu harus masuk voice channel dulu.' });
        return;
      }

      const track = await musicManager.search(query);
      if (!track) {
        await respond({ content: '❌ Lagu tidak ditemukan. Coba keyword lain ya.' });
        return;
      }

      if (!musicManager.shoukaku.players.has(guildId)) {
        await musicManager.join({ guildId, voiceChannelId: voiceChannel.id, shardId: guild.shardId });
      }

      const queue = await musicManager.enqueue({ guildId, track, textChannelId: channelId });
      await respond(createNowPlayingComponents(queue.current ?? track, queue.loop, env.musicEmbedColor));
      return;
    }

    case 'skip': {
      const track = await musicManager.skip(guildId);
      await respond({ content: track ? `⏭️ Skip berhasil. Lanjut: **${track.info.title}**` : '📭 Antrian habis.' });
      return;
    }

    case 'stop': {
      await musicManager.stop(guildId);
      await respond({ content: '⏹️ Musik dihentikan dan bot keluar dari voice channel.' });
      return;
    }

    case 'queue': {
      const queue = musicManager.getQueue(guildId);
      const embed = new EmbedBuilder()
        .setColor(env.musicEmbedColor)
        .setTitle('📜 Daftar Antrian Musik')
        .setDescription(formatQueue(queue));
      await respond({ embeds: [embed] });
      return;
    }

    case 'loop': {
      const enabled = musicManager.toggleLoop(guildId);
      await respond({ content: `🔁 Loop sekarang: **${enabled ? 'Aktif' : 'Mati'}**` });
      return;
    }

    case 'ai': {
      const prompt = options.prompt;
      if (!prompt?.trim()) {
        await respond({ content: '⚠️ Prompt AI tidak boleh kosong. Contoh: `!ai kasih ide event server`.' });
        return;
      }
      const answer = await aiService.ask({ userId, prompt });
      await respond(
        createAIResponseComponents({
          prompt,
          answer,
          isOwner: ownerOnly(userId, env.ownerId),
          color: env.aiEmbedColor
        })
      );
      return;
    }

    case 'restart': {
      if (!ownerOnly(userId, env.ownerId)) {
        await respond({ content: '🚫 Command ini hanya untuk owner.' });
        return;
      }
      await respond({ content: '♻️ Bot akan restart sekarang...' });
      setTimeout(() => process.exit(0), 1_000);
      return;
    }

    case 'owner-stats': {
      if (!ownerOnly(userId, env.ownerId)) {
        await respond({ content: '🚫 Command ini hanya untuk owner.' });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('🛠️ Owner Stats')
        .addFields(
          { name: '🏠 Guild', value: `${client.guilds.cache.size}`, inline: true },
          { name: '📶 Ping', value: `${client.ws.ping} ms`, inline: true },
          { name: '⏳ Uptime', value: `${Math.floor(process.uptime())} detik`, inline: true }
        );

      await respond({ embeds: [embed] });
      return;
    }

    case 'owner-sync': {
      if (!ownerOnly(userId, env.ownerId)) {
        await respond({ content: '🚫 Command ini hanya untuk owner.' });
        return;
      }
      const count = await registerCommands();
      await respond({ content: `✅ Sinkronisasi selesai. Total command: **${count}**.` });
      return;
    }

    default:
      await respond({ content: '❓ Command belum tersedia.' });
  }
}

export async function handleCommand(interaction, context) {
  const ephemeralCommands = new Set(['skip', 'owner-stats', 'owner-sync']);
  if (ephemeralCommands.has(interaction.commandName)) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  } else {
    await interaction.deferReply();
  }

  await executeBotCommand({
    command: interaction.commandName,
    options: {
      query: interaction.options.getString('query'),
      prompt: interaction.options.getString('prompt')
    },
    userId: interaction.user.id,
    member: interaction.member,
    guild: interaction.guild,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    client: interaction.client,
    respond: (payload) => interaction.editReply(payload),
    context
  });
}
