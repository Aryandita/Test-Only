import User from '../database/models/User.js';
import MusicProfile from '../database/models/MusicProfile.js';

const XP_PER_MESSAGE = 5;
const XP_FOR_LEVEL = 100;

export class LevellingService {
  async addExperience(userId, amount = XP_PER_MESSAGE) {
    try {
      let user = await User.findOne({ userId });
      if (!user) {
        user = new User({ userId });
      }

      user.experience += amount;

      // Check for level up
      const xpNeeded = user.level * XP_FOR_LEVEL;
      let leveledUp = false;
      let oldLevel = user.level;

      while (user.experience >= xpNeeded) {
        user.level += 1;
        user.experience -= xpNeeded;
        leveledUp = true;
      }

      await user.save();

      return {
        leveledUp,
        oldLevel,
        newLevel: user.level,
        experience: user.experience,
        xpNeeded: user.level * XP_FOR_LEVEL,
      };
    } catch (error) {
      console.error('❌ Error adding experience:', error);
      throw error;
    }
  }

  async getLevel(userId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) return null;

      return {
        level: user.level,
        experience: user.experience,
        xpNeeded: user.level * XP_FOR_LEVEL,
      };
    } catch (error) {
      console.error('❌ Error getting level:', error);
      throw error;
    }
  }

  async getLeaderboard(guildId, limit = 10) {
    try {
      // Get users by level and experience
      const users = await User.find()
        .sort({ level: -1, experience: -1 })
        .limit(limit);

      return users.map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        level: user.level,
        experience: user.experience,
      }));
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      throw error;
    }
  }

  async getUserRank(userId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) return null;

      const rank = await User.countDocuments({
        $or: [
          { level: { $gt: user.level } },
          { level: user.level, experience: { $gt: user.experience } },
        ],
      });

      return rank + 1;
    } catch (error) {
      console.error('❌ Error getting user rank:', error);
      throw error;
    }
  }
}

export class MusicLevellingService {
  async updateMusicStats(guildId, userId, username, track, artist, friendId = null) {
    try {
      let profile = await MusicProfile.findOne({ userId, guildId });

      if (!profile) {
        profile = new MusicProfile({
          userId,
          guildId,
          username,
        });
      }

      // Update track stats
      const existingTrack = profile.frequentTracks.find(
        (t) => t.trackId === track.id
      );
      if (existingTrack) {
        existingTrack.playCount += 1;
        existingTrack.lastPlayedAt = new Date();
        existingTrack.totalDuration += track.duration || 0;
      } else {
        profile.frequentTracks.push({
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          url: track.url,
          playCount: 1,
          lastPlayedAt: new Date(),
          totalDuration: track.duration || 0,
        });
      }

      // Update artist stats
      const existingArtist = profile.frequentArtists.find(
        (a) => a.artistName === artist
      );
      if (existingArtist) {
        existingArtist.playCount += 1;
        existingArtist.lastPlayedAt = new Date();
        existingArtist.totalDuration += track.duration || 0;
      } else {
        profile.frequentArtists.push({
          artistName: artist,
          playCount: 1,
          lastPlayedAt: new Date(),
          totalDuration: track.duration || 0,
        });
      }

      // Update listening friends
      if (friendId) {
        const existingFriend = profile.listeningFriends.find(
          (f) => f.friendId === friendId
        );
        if (existingFriend) {
          existingFriend.listeningCount += 1;
          existingFriend.lastListenedTogether = new Date();
        } else {
          profile.listeningFriends.push({
            friendId,
            friendName: friendId, // Will be updated when needed
            listeningCount: 1,
            lastListenedTogether: new Date(),
          });
        }
      }

      // Update overall stats
      profile.totalTracksPlayed += 1;
      profile.totalListeningTime += track.duration || 0;
      profile.lastUpdatedAt = new Date();

      // Increment music experience
      profile.musicExperience += 10;

      // Check for music level up
      const xpNeeded = profile.musicLevel * 100;
      if (profile.musicExperience >= xpNeeded) {
        profile.musicLevel += 1;
        profile.musicExperience -= xpNeeded;
      }

      // Keep only top 20 of each
      profile.frequentTracks = profile.frequentTracks.sort((a, b) => b.playCount - a.playCount).slice(0, 20);
      profile.frequentArtists = profile.frequentArtists.sort((a, b) => b.playCount - a.playCount).slice(0, 15);
      profile.listeningFriends = profile.listeningFriends.sort((a, b) => b.listeningCount - a.listeningCount).slice(0, 10);

      await profile.save();
      return profile;
    } catch (error) {
      console.error('❌ Error updating music stats:', error);
      throw error;
    }
  }

  async getMusicProfile(userId, guildId) {
    try {
      const profile = await MusicProfile.findOne({ userId, guildId });
      return profile;
    } catch (error) {
      console.error('❌ Error getting music profile:', error);
      throw error;
    }
  }

  async getMusicLeaderboard(guildId, limit = 10) {
    try {
      const profiles = await MusicProfile.find({ guildId })
        .sort({ musicLevel: -1, musicExperience: -1 })
        .limit(limit);

      return profiles.map((profile, index) => ({
        rank: index + 1,
        userId: profile.userId,
        username: profile.username,
        level: profile.musicLevel,
        totalTracks: profile.totalTracksPlayed,
        totalTime: profile.totalListeningTime,
      }));
    } catch (error) {
      console.error('❌ Error getting music leaderboard:', error);
      throw error;
    }
  }
}

export default new LevellingService();
