import { EmbedBuilder, MessageFlags } from 'discord.js';
import { createNowPlayingComponents, formatQueue } from '../utils/music-ui.js';

function ownerOnly(interaction, ownerId) {
  return interaction.user.id === ownerId;
}

export async function handleCommand(interaction, context) {
  const { musicManager, aiService, env, registerCommands } = context;

  switch (interaction.commandName) {
    case 'play': {
      const query = interaction.options.getString('query', true);
      const voiceChannel = interaction.member.voice.channel;

      if (!voiceChannel) {
        await interaction.reply({ content: 'Kamu harus masuk voice channel dulu.', ephemeral: true });
        return;
      }

      await interaction.deferReply();

      const track = await musicManager.search(query);
      if (!track) {
        await interaction.editReply('Lagu tidak ditemukan. Coba keyword lain.');
        return;
      }

      if (!musicManager.shoukaku.players.has(interaction.guildId)) {
        await musicManager.join({
          guildId: interaction.guildId,
          voiceChannelId: voiceChannel.id,
          shardId: interaction.guild.shardId
        });
      }

      const queue = await musicManager.enqueue({
        guildId: interaction.guildId,
        track,
        textChannelId: interaction.channelId
      });

      await interaction.editReply(createNowPlayingComponents(queue.current ?? track, queue.loop));
      return;
    }

    case 'skip': {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const track = await musicManager.skip(interaction.guildId);
      await interaction.editReply(track ? `Skip berhasil. Lanjut: **${track.info.title}**` : 'Antrian habis.');
      return;
    }

    case 'stop': {
      await musicManager.stop(interaction.guildId);
      await interaction.reply({ content: 'Musik dihentikan dan bot keluar dari voice channel.' });
      return;
    }

    case 'queue': {
      const queue = musicManager.getQueue(interaction.guildId);
      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('📜 Queue')
        .setDescription(formatQueue(queue));

      await interaction.reply({ embeds: [embed] });
      return;
    }

    case 'loop': {
      const enabled = musicManager.toggleLoop(interaction.guildId);
      await interaction.reply({ content: `Loop sekarang: **${enabled ? 'Aktif' : 'Mati'}**` });
      return;
    }

    case 'ai': {
      const prompt = interaction.options.getString('prompt', true);
      await interaction.deferReply();
      const answer = await aiService.ask({ userId: interaction.user.id, prompt });
      await interaction.editReply(`🤖 ${answer.slice(0, 1900)}`);
      return;
    }

    case 'restart': {
      if (!ownerOnly(interaction, env.ownerId)) {
        await interaction.reply({ content: 'Command ini hanya untuk owner.', ephemeral: true });
        return;
      }

      await interaction.reply('Bot akan restart sekarang...');
      setTimeout(() => process.exit(0), 1_000);
      return;
    }

    case 'owner-stats': {
      if (!ownerOnly(interaction, env.ownerId)) {
        await interaction.reply({ content: 'Command ini hanya untuk owner.', ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('Owner Stats')
        .addFields(
          { name: 'Guild', value: `${interaction.client.guilds.cache.size}`, inline: true },
          { name: 'Ping', value: `${interaction.client.ws.ping} ms`, inline: true },
          { name: 'Uptime', value: `${Math.floor(process.uptime())} detik`, inline: true }
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    case 'owner-sync': {
      if (!ownerOnly(interaction, env.ownerId)) {
        await interaction.reply({ content: 'Command ini hanya untuk owner.', ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      const count = await registerCommands();
      await interaction.editReply(`Sinkronisasi selesai. Total command: ${count}.`);
      return;
    }

    default:
      await interaction.reply({ content: 'Command belum tersedia.', ephemeral: true });
  }
}
