import Guild from '../database/models/Guild.js';
import { createCanvas } from 'canvas';

export class WelcomerService {
  async getGuildSettings(guildId) {
    try {
      let guildSettings = await Guild.findOne({ guildId });
      if (!guildSettings) {
        guildSettings = new Guild({ guildId });
        await guildSettings.save();
      }
      return guildSettings;
    } catch (error) {
      console.error('❌ Error getting guild settings:', error);
      throw error;
    }
  }

  async updateWelcomeSettings(guildId, settings) {
    try {
      let guildSettings = await Guild.findOne({ guildId });
      if (!guildSettings) {
        guildSettings = new Guild({ guildId });
      }

      if (settings.enabled !== undefined) guildSettings.welcomeEnabled = settings.enabled;
      if (settings.channelId) guildSettings.welcomeChannelId = settings.channelId;
      if (settings.message) guildSettings.welcomeMessage = settings.message;
      if (settings.imageEnabled !== undefined) guildSettings.welcomeImageEnabled = settings.imageEnabled;

      await guildSettings.save();
      return guildSettings;
    } catch (error) {
      console.error('❌ Error updating welcome settings:', error);
      throw error;
    }
  }

  async generateWelcomeImage(username, profileImageUrl) {
    try {
      const canvas = createCanvas(1200, 400);
      const ctx = canvas.getContext('2d');

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 1200, 400);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 400);

      // Decorative elements
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, 1180, 380);

      // Welcome text
      ctx.fillStyle = '#00d4ff';
      ctx.font = 'bold 64px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('WELCOME', 600, 100);

      // Username
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(username, 600, 180);

      // Decorative bottom bar
      ctx.fillStyle = '#00d4ff';
      ctx.fillRect(0, 350, 1200, 50);

      // Footer text
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Enjoy your stay!', 600, 380);

      return canvas.toBuffer('image/png');
    } catch (error) {
      console.error('❌ Error generating welcome image:', error);
      throw error;
    }
  }
}

export default new WelcomerService();
