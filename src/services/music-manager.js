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
    this.onTrackStart = null;
    this.onQueueEnd = null;
    this.onAutoplaySearching = null;
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

  setTrackStartNotifier(callback) {
    this.onTrackStart = callback;
  }

  setQueueEndNotifier(callback) {
    this.onQueueEnd = callback;
  }

  setAutoplaySearchingNotifier(callback) {
    this.onAutoplaySearching = callback;
  }

  getQueue(guildId) {
    if (!queueStore.has(guildId)) {
      queueStore.set(guildId, {
        tracks: [],
        current: null,
        textChannelId: null,
        loop: false,
        autoplay: false,
        manualTransition: false,
        advancing: false,
        recentAutoplayIds: []
      });
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
        const queue = this.getQueue(guildId);
        if (queue.manualTransition || queue.advancing) return;
        await this.playNext(guildId, { isAutoTransition: true });
      } catch (error) {
        console.error(`❌ Gagal auto-play next (${guildId}): ${error.message}`);
      }
    });

    return player;
  }

  async resolveTracks(query) {
    const node = this.shoukaku.nodes.get('main') ?? [...this.shoukaku.nodes.values()][0];
    if (!node) throw new Error('Lavalink node belum siap.');

    const keyword = query.startsWith('http') ? query : `ytsearch:${query}`;
    const result = await node.rest.resolve(keyword);
    if (result.loadType === 'empty' || !result.data?.length) return [];

    return result.data;
  }

  async search(query) {
    const tracks = await this.resolveTracks(query);
    return tracks[0] ?? null;
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

  async buildAutoplayCandidate(queue) {
    if (!queue.current) return null;

    if (this.onAutoplaySearching) {
      await this.onAutoplaySearching({ queue });
    }

    const artist = queue.current.info.author ?? '';
    const title = queue.current.info.title ?? '';
    const cleanedTitle = title
      .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
      .replace(/official|lyrics|video|audio|feat\.?/gi, '')
      .trim();

    const firstWords = cleanedTitle
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4)
      .join(' ');

    const queries = [
      `${artist} songs`,
      `${artist} ${firstWords}`,
      `${firstWords} vibe music`
    ].filter((q) => q.trim().length > 0);

    const unique = new Map();
    for (const query of queries) {
      const tracks = await this.resolveTracks(query);
      for (const track of tracks) {
        const id = track.info?.identifier ?? track.encoded ?? track.track;
        if (!id || unique.has(id)) continue;
        unique.set(id, track);
      }
    }

    const blockedIds = new Set([queue.current.info?.identifier, ...queue.recentAutoplayIds].filter(Boolean));
    const candidate = [...unique.values()].find((track) => !blockedIds.has(track.info?.identifier));

    if (candidate?.info?.identifier) {
      queue.recentAutoplayIds.push(candidate.info.identifier);
      if (queue.recentAutoplayIds.length > 20) {
        queue.recentAutoplayIds.shift();
      }
    }

    return candidate ?? null;
  }

  async playNext(guildId, options = {}) {
    const player = this.shoukaku.players.get(guildId);
    const queue = this.getQueue(guildId);

    if (!player) throw new Error('Player tidak ditemukan.');
    if (queue.advancing && !options.force) return queue.current;

    queue.advancing = true;
    try {
      if (queue.loop && queue.current) {
        queue.tracks.unshift(queue.current);
      }

      let nextTrack = queue.tracks.shift();

      if (!nextTrack && queue.autoplay) {
        nextTrack = await this.buildAutoplayCandidate(queue);
      }

      if (!nextTrack) {
        queue.current = null;
        await player.stopTrack();
        if (this.onQueueEnd) {
          await this.onQueueEnd({ guildId, queue });
        }
        return null;
      }

      queue.current = nextTrack;

      const encodedTrack = nextTrack.encoded ?? nextTrack.track ?? nextTrack.encodedTrack;
      if (!encodedTrack) throw new Error('Encoded track tidak ditemukan dari hasil Lavalink.');

      await player.playTrack({ encodedTrack });

      if (this.onTrackStart) {
        await this.onTrackStart({
          guildId,
          track: nextTrack,
          queue,
          isAutoTransition: Boolean(options.isAutoTransition)
        });
      }

      return nextTrack;
    } finally {
      queue.advancing = false;
    }
  }

  async skip(guildId) {
    const player = this.shoukaku.players.get(guildId);
    const queue = this.getQueue(guildId);
    if (!player) throw new Error('Player tidak ditemukan.');

    queue.manualTransition = true;
    try {
      await player.stopTrack();
      return await this.playNext(guildId, { isAutoTransition: true, force: true });
    } finally {
      queue.manualTransition = false;
    }
  }

  async stop(guildId) {
    const player = this.shoukaku.players.get(guildId);
    const queue = this.getQueue(guildId);
    queue.tracks = [];
    queue.current = null;
    queue.loop = false;
    queue.manualTransition = false;
    queue.advancing = false;

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

  toggleAutoplay(guildId) {
    const queue = this.getQueue(guildId);
    queue.autoplay = !queue.autoplay;
    return queue.autoplay;
  }
}
