import { Connectors, Shoukaku } from 'shoukaku';

const queueStore = new Map();

export class MusicManager {
  constructor(client, env) {
    const nodes = [
      {
        name: 'main',
        url: `${env.lavalink.host}:${env.lavalink.port}`,
        auth: env.lavalink.password,
        secure: env.lavalink.secure
      }
    ];

    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
      moveOnDisconnect: false,
      moveOnDestroy: false,
      resume: true,
      reconnectTries: 3,
      reconnectInterval: 5_000,
      restTimeout: 10_000
    });

    this.shoukaku.on('ready', (name) => {
      console.log(`🟢 Lavalink node **${name}** berhasil terhubung! Musik siap diputar 🎶`);
    });

    this.shoukaku.on('error', (name, error) => {
      console.error(`🔴 Lavalink node **${name}** gagal/bermasalah:`, error);
    });

    this.shoukaku.on('close', (name, code, reason) => {
      console.warn(`🟠 Lavalink node **${name}** terputus (${code}) - ${reason ?? 'tanpa alasan'}`);
    });
  }

  getQueue(guildId) {
    if (!queueStore.has(guildId)) {
      queueStore.set(guildId, {
        tracks: [],
        current: null,
        textChannelId: null,
        loop: false
      });
    }

    return queueStore.get(guildId);
  }

  async join({ guildId, voiceChannelId, shardId }) {
    return this.shoukaku.joinVoiceChannel({
      guildId,
      channelId: voiceChannelId,
      shardId,
      deaf: true
    });
  }

  async search(query) {
    if (!query?.trim()) return null;
    const node = this.shoukaku.nodes.get('main') ?? [...this.shoukaku.nodes.values()][0];
    if (!node) throw new Error('Lavalink node belum siap.');

    const result = await node.rest.resolve(query.startsWith('http') ? query : `ytsearch:${query}`);
    const tracks = this.normalizeTracks(result);

    return tracks[0] ?? null;
  }

  normalizeTracks(result) {
    if (!result || result.loadType === 'empty') return [];
    if (Array.isArray(result.data)) return result.data;

    if (result.loadType === 'track' && result.data) {
      return [result.data];
    }

    if (result.loadType === 'playlist' && Array.isArray(result.data?.tracks)) {
      return result.data.tracks;
    }

    return [];
  }

  async enqueue({ guildId, track, textChannelId }) {
    const queue = this.getQueue(guildId);
    queue.textChannelId = textChannelId;
    queue.tracks.push(track);

    if (!queue.current) {
      await this.playNext(guildId);
    }

    return queue;
  }

  async playNext(guildId) {
    const player = this.shoukaku.players.get(guildId);
    const queue = this.getQueue(guildId);

    if (!player) throw new Error('Player tidak ditemukan.');

    if (queue.loop && queue.current) {
      queue.tracks.unshift(queue.current);
    }

    const nextTrack = queue.tracks.shift();

    if (!nextTrack) {
      queue.current = null;
      await player.stopTrack();
      return null;
    }

    const encoded = nextTrack.encoded ?? nextTrack.track;
    if (!encoded) {
      throw new Error('Track tidak memiliki encoded data (penyebab umum Bad Request Lavalink).');
    }

    queue.current = nextTrack;
    await player.playTrack({ track: encoded });
    return nextTrack;
  }

  async skip(guildId) {
    const player = this.shoukaku.players.get(guildId);
    if (!player) throw new Error('Player tidak ditemukan.');
    await player.stopTrack();
    return this.playNext(guildId);
  }

  async stop(guildId) {
    const player = this.shoukaku.players.get(guildId);
    const queue = this.getQueue(guildId);
    queue.tracks = [];
    queue.current = null;
    queue.loop = false;

    if (player) {
      await player.stopTrack();
      await this.shoukaku.leaveVoiceChannel(guildId);
    }
  }

  toggleLoop(guildId) {
    const queue = this.getQueue(guildId);
    queue.loop = !queue.loop;
    return queue.loop;
  }
}
