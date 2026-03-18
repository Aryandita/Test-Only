/**
 * Spotify Service - Parse Spotify URLs tanpa Client ID/Secret
 * Menggunakan YouTube search untuk mencari track dari Spotify info
 */

export class SpotifyService {
  constructor(musicManager) {
    this.musicManager = musicManager;
    this.spotifyUrlRegex = /https:\/\/open\.spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)/;
  }

  /**
   * Deteksi apakah query adalah Spotify URL
   */
  isSpotifyUrl(query) {
    return this.spotifyUrlRegex.test(query);
  }

  /**
   * Parse Spotify URI dari URL dan dapatkan metadata
   * URL format: https://open.spotify.com/track/7qiZfU4dY1lsylvNFHOH1O?si=...
   * Album: https://open.spotify.com/album/4OIKPDB4LrXFLSxHZO39Kj
   * Playlist: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
   */
  async parseSpotifyUrl(url) {
    try {
      const match = url.match(this.spotifyUrlRegex);
      if (!match) return null;

      const [, type, id] = match;

      // Fetch dari Spotify open graph (public metadata tanpa auth)
      const spotifyMetadata = await this.fetchSpotifyMetadata(type, id);
      if (!spotifyMetadata) return null;

      return {
        type,
        id,
        metadata: spotifyMetadata
      };
    } catch (error) {
      console.error(`❌ Spotify parse error: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch metadata dari Spotify menggunakan public endpoints
   */
  async fetchSpotifyMetadata(type, id) {
    try {
      // Menggunakan iframe/oembed public endpoint dari Spotify
      const apiUrl = `https://open.spotify.com/embed/oembed?url=https://open.spotify.com/${type}/${id}`;
      const response = await fetch(apiUrl);

      if (!response.ok) return null;

      const data = await response.json();
      return {
        title: data.title || '',
        provider: 'spotify',
        html: data.html || ''
      };
    } catch (error) {
      console.warn(`⚠️ Spotify embed fetch error: ${error.message}`);

      // Fallback: extract info dari Open Graph meta tags
      return await this.fetchSpotifyOpenGraph(type, id);
    }
  }

  /**
   * Fallback: scrape metadata dari Open Graph tags
   */
  async fetchSpotifyOpenGraph(type, id) {
    try {
      const url = `https://open.spotify.com/${type}/${id}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0'
        }
      });

      if (!response.ok) return null;

      const html = await response.text();

      // Extract OG tags
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

      return {
        title: titleMatch?.[1] || `Spotify ${type}`,
        description: descMatch?.[1] || '',
        provider: 'spotify'
      };
    } catch (error) {
      console.warn(`⚠️ OpenGraph scrape failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Search untuk YouTube track dari Spotify info
   */
  async searchYouTubeFromSpotify(spotifyInfo) {
    try {
      const { type, metadata } = spotifyInfo;

      // Extract artist dan song name dari title
      let searchQuery = metadata.title;

      // Spotify format: "Song Name - Artist Name" atau "Song Title"
      if (metadata.title.includes(' - ')) {
        searchQuery = metadata.title; // Keep as is, lebih accurate
      }

      // Add "audio" untuk mendapat version yang 1 jam (no copyright)
      const searchQueryWithAudio = `${searchQuery} audio`;

      // Search di YouTube via Lavalink
      const tracks = await this.musicManager.resolveTracks(searchQueryWithAudio);

      if (!tracks || tracks.length === 0) {
        // Try tanpa "audio" suffix
        return await this.musicManager.resolveTracks(searchQuery);
      }

      return tracks;
    } catch (error) {
      console.error(`❌ YouTube search error: ${error.message}`);
      return [];
    }
  }

  /**
   * Handle Spotify track URL
   */
  async handleSpotifyTrack(url) {
    const spotifyInfo = await this.parseSpotifyUrl(url);
    if (!spotifyInfo) return null;

    const tracks = await this.searchYouTubeFromSpotify(spotifyInfo);
    return tracks && tracks.length > 0 ? tracks[0] : null;
  }

  /**
   * Handle Spotify album URL - return all tracks
   */
  async handleSpotifyAlbum(url) {
    const spotifyInfo = await this.parseSpotifyUrl(url);
    if (!spotifyInfo || spotifyInfo.type !== 'album') return null;

    // From album metadata, extract tracks
    const { metadata } = spotifyInfo;

    // Spotify doesn't provide full tracklist via oembed
    // Parse dari description jika tersedia, atau search album name
    const searchQuery = `${metadata.title} full album audio`;
    return await this.musicManager.resolveTracks(searchQuery);
  }

  /**
   * Handle Spotify playlist URL
   */
  async handleSpotifyPlaylist(url) {
    const spotifyInfo = await this.parseSpotifyUrl(url);
    if (!spotifyInfo || spotifyInfo.type !== 'playlist') return null;

    const { metadata } = spotifyInfo;

    // Search playlist
    const searchQuery = `${metadata.title} playlist`;
    return await this.musicManager.resolveTracks(searchQuery);
  }

  /**
   * Main handler untuk semua Spotify URLs
   */
  async handleSpotifyUrl(url) {
    const spotifyInfo = await this.parseSpotifyUrl(url);
    if (!spotifyInfo) return null;

    const { type } = spotifyInfo;

    try {
      switch (type) {
        case 'track':
          return [await this.handleSpotifyTrack(url)].filter(Boolean);

        case 'album':
          return await this.handleSpotifyAlbum(url);

        case 'playlist':
          return await this.handleSpotifyPlaylist(url);

        default:
          return null;
      }
    } catch (error) {
      console.error(`❌ Spotify handler error (${type}): ${error.message}`);
      return null;
    }
  }
}
