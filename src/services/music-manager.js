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

    this.client = client;
    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
      moveOnDisconnect: false,
      moveOnDestroy: false,
      resume: true,
      reconnectTries: 3,
      reconnectInterval: 5_000,
      restTimeout: 10_000
    });

    this.shoukaku.on('ready', (name) => console.log(`✅🎵 Node Lavalink ${name} terhubung!`));
    this.shoukaku.on('error', (name, error) => console.error(`❌🎵 Node ${name} error: ${error.message}`));
    this.shoukaku.on('close', (name, code, reason) =>
      console.warn(`⚠️🎵 Node ${name} ditutup (code: ${code}) reason: ${reason}`)
    );
  }

  getQueue(guildId) {
    if (!queueStore.has(guildId)) {
      queueStore.set(guildId, { tracks: [], current: null, textChannelId: null, loop: false });
    }
    return queueStore.get(guildId);
  }

  async join({ guildId, voiceChannelId, shardId }) {
    const player = await this.shoukaku.joinVoiceChannel({
      guildId,
      channelId: voiceChannelId,
      shardId,
      deaf: true
    });

    player.on('end', async () => {
      try {
        await this.playNext(guildId);
      } catch (error) {
        console.error(`❌ Gagal auto-play next (${guildId}): ${error.message}`);
      }
    });

    return player;
  }

  async search(query) {
    const node = this.shoukaku.nodes.get('main') ?? [...this.shoukaku.nodes.values()][0];
    if (!node) throw new Error('Lavalink node belum siap.');

    const keyword = query.startsWith('http') ? query : `ytsearch:${query}`;
    const result = await node.rest.resolve(keyword);
    if (result.loadType === 'empty' || !result.data?.length) return null;

    return result.data[0];
  }

  async enqueue({ guildId, track, textChannelId }) {
    const queue = this.getQueue(guildId);
    queue.textChannelId = textChannelId;

    const wasPlaying = Boolean(queue.current);
    if (wasPlaying) {
      queue.tracks.push(track);
      return {
        queue,
        status: 'queued',
        track,
        position: queue.tracks.length
      };
    }

    queue.tracks.push(track);
    const startedTrack = await this.playNext(guildId);
    return {
      queue,
      status: 'playing',
      track: startedTrack ?? track,
      position: null
    };
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

    queue.current = nextTrack;

    const encodedTrack = nextTrack.encoded ?? nextTrack.track ?? nextTrack.encodedTrack;
    if (!encodedTrack) throw new Error('Encoded track tidak ditemukan dari hasil Lavalink.');

    await player.playTrack({ encodedTrack });
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
