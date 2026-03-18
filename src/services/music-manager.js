import { Connectors, Shoukaku } from 'shoukaku';
import { SpotifyService } from './spotify-service.js';

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
    this.spotifyService = new SpotifyService(this);
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
        twentyfourseven: false,  // 24/7 mode
        manualTransition: false,
        advancing: false,
        recentAutoplayIds: new Set(),
        recentArtists: [],
        lastAutoplayQuery: null
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

  async handleSpotifyQuery(query) {
    // Check if it's a Spotify URL
    if (this.spotifyService.isSpotifyUrl(query)) {
      const tracks = await this.spotifyService.handleSpotifyUrl(query);
      return tracks && tracks.length > 0 ? tracks : [];
    }

    // Regular YouTube search
    return await this.resolveTracks(query);
  }

  toggle24_7(guildId) {
    const queue = this.getQueue(guildId);
    queue.twentyfourseven = !queue.twentyfourseven;
    
    // 24/7 mode automatically enables autoplay
    if (queue.twentyfourseven) {
      queue.autoplay = true;
    }
    
    return queue.twentyfourseven;
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

  // Calculate string similarity (0-1)
  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance
  getEditDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  async buildAutoplayCandidate(queue) {
    if (!queue.current) return null;

    if (this.onAutoplaySearching) {
      await this.onAutoplaySearching({ queue });
    }

    const artist = queue.current.info.author ?? '';
    const title = queue.current.info.title ?? '';
    const currentId = queue.current.info?.identifier;

    // Extract title without parentheses/brackets
    const cleanedTitle = title
      .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
      .replace(/official|audio|video|lyrics|remix|cover|feat\.?|ft\.?/gi, '')
      .trim();

    const firstWords = cleanedTitle
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .join(' ');

    // Rotate through different search strategies
    const searchStrategies = [
      `${artist} similar`,
      `${firstWords} mix`,
      `${artist} songs`,
      `${firstWords} playlist`
    ].filter(q => q.trim().length > 5);

    const uniqueTracks = new Map();
    const blockedIds = new Set(Array.from(queue.recentAutoplayIds));
    if (currentId) blockedIds.add(currentId);

    // Search using multiple strategies
    for (const query of searchStrategies) {
      try {
        const tracks = await this.resolveTracks(query);
        
        for (const track of tracks) {
          const trackId = track.info?.identifier ?? track.encoded ?? track.track;
          const trackTitle = track.info?.title ?? '';
          const trackArtist = track.info?.author ?? '';

          if (!trackId || blockedIds.has(trackId)) continue;

          // Skip if title too similar to current track
          const titleSimilarity = this.calculateSimilarity(trackTitle, title);
          if (titleSimilarity > 0.7) continue;

          // Don't spam same artist too much
          const recentArtistCount = queue.recentArtists.filter(a => a.toLowerCase() === trackArtist.toLowerCase()).length;
          if (recentArtistCount >= 2) continue;

          uniqueTracks.set(trackId, track);
          if (uniqueTracks.size >= 50) break;
        }
        
        if (uniqueTracks.size >= 20) break; // Got enough candidates
      } catch (error) {
        console.warn(`⚠️ Autoplay search error for "${query}":`, error.message);
        continue;
      }
    }

    // Pick a random candidate from our pool
    const candidates = Array.from(uniqueTracks.values());
    if (candidates.length === 0) {
      // Fallback: search by artist+genre
      try {
        const fallbackTracks = await this.resolveTracks(`${artist} playlist`);
        if (fallbackTracks.length > 0) {
          return this.selectBestFallbackTrack(fallbackTracks, queue);
        }
      } catch (error) {
        console.warn('⚠️ Fallback autoplay search failed:', error.message);
      }
      return null;
    }

    // Random selection from candidates (with some weighting towards better results)
    const selectedTrack = candidates[Math.floor(Math.random() * Math.min(candidates.length, 15))];

    if (selectedTrack?.info?.identifier) {
      // Keep history (max 150 tracks)
      queue.recentAutoplayIds.add(selectedTrack.info.identifier);
      if (queue.recentAutoplayIds.size > 150) {
        // Remove oldest entries
        const arr = Array.from(queue.recentAutoplayIds);
        queue.recentAutoplayIds = new Set(arr.slice(arr.length - 150));
      }

      // Track artist frequency
      const artist = selectedTrack.info?.author ?? '';
      queue.recentArtists.push(artist);
      if (queue.recentArtists.length > 30) {
        queue.recentArtists.shift();
      }
    }

    return selectedTrack ?? null;
  }

  selectBestFallbackTrack(tracks, queue) {
    const blockedIds = new Set(Array.from(queue.recentAutoplayIds));
    const currentId = queue.current?.info?.identifier;
    if (currentId) blockedIds.add(currentId);

    for (const track of tracks) {
      const trackId = track.info?.identifier ?? track.encoded ?? track.track;
      if (!blockedIds.has(trackId)) {
        return track;
      }
    }
    return null;
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
