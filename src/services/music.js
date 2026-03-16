import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import { Connectors, Player, Shoukaku } from 'shoukaku';

export class MusicService {
  constructor(client, lavalinkConfig) {
    const nodes = [
      {
        name: 'main',
        url: `${lavalinkConfig.host}:${lavalinkConfig.port}`,
        auth: lavalinkConfig.auth,
        secure: lavalinkConfig.secure
      }
    ];

    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
      moveOnDisconnect: false,
      resume: false,
      reconnectInterval: 5_000,
      reconnectTries: 5
    });

    this.players = new Map();
    this.queues = new Map();
  }

  async ensurePlayer(interaction) {
    const guildId = interaction.guildId;
    if (!guildId) throw new Error('Command hanya bisa dipakai di server.');

    const memberVc = interaction.member?.voice?.channel;
    if (!memberVc) throw new Error('Masuk voice channel dulu ya.');

    let player = this.players.get(guildId);
    if (!player) {
      player = await this.shoukaku.joinVoiceChannel({
        guildId,
        channelId: memberVc.id,
        shardId: interaction.guild.shardId,
        deaf: true
      });

      this.players.set(guildId, player);
      this.queues.set(guildId, []);

      player.on('end', () => this.playNext(guildId).catch(() => null));
    }

    return player;
  }

  async searchTrack(query) {
    const node = this.shoukaku.nodes.get('main');
    const result = await node.rest.resolve(`ytsearch:${query}`);
    return result?.data?.[0] ?? null;
  }

  getQueue(guildId) {
    if (!this.queues.has(guildId)) this.queues.set(guildId, []);
    return this.queues.get(guildId);
  }

  async enqueue(interaction, query) {
    const player = await this.ensurePlayer(interaction);
    const track = await this.searchTrack(query);
    if (!track) throw new Error('Lagu tidak ditemukan.');

    const queue = this.getQueue(interaction.guildId);
    queue.push(track);

    if (!player.track) {
      await this.playNext(interaction.guildId);
    }

    return track;
  }

  async playNext(guildId) {
    const queue = this.getQueue(guildId);
    const player = this.players.get(guildId);
    if (!player) return;

    const next = queue.shift();
    if (!next) {
      await player.stopTrack();
      return;
    }

    await player.playTrack({ track: next.encoded });
  }

  nowPlayingEmbed(track, requestedBy) {
    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎵 Now Playing')
      .setDescription(`**${track.info.title}**\nby ${track.info.author}`)
      .addFields({ name: 'Requested by', value: requestedBy, inline: true })
      .setFooter({ text: 'Component v2 controls' });
  }

  controlComponents() {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('music_pause').setLabel('Pause').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_resume').setLabel('Resume').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setStyle(ButtonStyle.Danger)
      )
    ];
  }

  async onButton(interaction) {
    const guildId = interaction.guildId;
    const player = this.players.get(guildId);
    if (!player) {
      await interaction.reply({ content: 'Belum ada player aktif.', ephemeral: true });
      return;
    }

    if (interaction.customId === 'music_pause') {
      await player.setPaused(true);
      await interaction.reply({ content: '⏸️ Dipause.', flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
      return;
    }

    if (interaction.customId === 'music_resume') {
      await player.setPaused(false);
      await interaction.reply({ content: '▶️ Dilanjutkan.', flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
      return;
    }

    if (interaction.customId === 'music_skip') {
      await player.stopTrack();
      await interaction.reply({ content: '⏭️ Skip lagu.', flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
      return;
    }

    if (interaction.customId === 'music_stop') {
      this.getQueue(guildId).length = 0;
      await player.stopTrack();
      await interaction.reply({ content: '⏹️ Music dihentikan.', flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
    }
  }

  async destroy(guildId) {
    this.queues.delete(guildId);
    this.players.delete(guildId);
    await this.shoukaku.leaveVoiceChannel(guildId);
  }
}
