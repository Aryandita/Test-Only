import { v4 as uuidv4 } from 'uuid';
import Modmail from '../database/models/Modmail.js';

export class ModmailService {
  async createThread(guildId, userId, username) {
    try {
      const threadId = `MM-${uuidv4().substring(0, 12).toUpperCase()}`;

      const thread = new Modmail({
        threadId,
        guildId,
        userId,
        username,
        status: 'open',
      });

      await thread.save();
      return thread;
    } catch (error) {
      console.error('❌ Error creating modmail thread:', error);
      throw error;
    }
  }

  async addMessage(threadId, senderId, senderType, senderName, content, attachments = []) {
    try {
      const thread = await Modmail.findOne({ threadId });
      if (!thread) throw new Error('Thread not found');

      const messageId = uuidv4();
      thread.messages.push({
        messageId,
        senderId,
        senderType,
        senderName,
        content,
        attachments,
        timestamp: new Date(),
      });

      await thread.save();
      return thread;
    } catch (error) {
      console.error('❌ Error adding message:', error);
      throw error;
    }
  }

  async addNote(threadId, staffId, staffName, note) {
    try {
      const thread = await Modmail.findOne({ threadId });
      if (!thread) throw new Error('Thread not found');

      thread.notes.push({
        staffId,
        staffName,
        note,
        timestamp: new Date(),
      });

      await thread.save();
      return thread;
    } catch (error) {
      console.error('❌ Error adding note:', error);
      throw error;
    }
  }

  async closeThread(threadId, closedBy, reason) {
    try {
      const thread = await Modmail.findOne({ threadId });
      if (!thread) throw new Error('Thread not found');

      thread.status = 'closed';
      thread.closedAt = new Date();
      thread.closedBy = closedBy;
      thread.closeReason = reason;

      await thread.save();
      return thread;
    } catch (error) {
      console.error('❌ Error closing thread:', error);
      throw error;
    }
  }

  async assignStaff(threadId, staffId) {
    try {
      const thread = await Modmail.findOne({ threadId });
      if (!thread) throw new Error('Thread not found');

      if (!thread.assignedStaff.includes(staffId)) {
        thread.assignedStaff.push(staffId);
      }

      await thread.save();
      return thread;
    } catch (error) {
      console.error('❌ Error assigning staff:', error);
      throw error;
    }
  }

  async getThread(threadId) {
    try {
      const thread = await Modmail.findOne({ threadId });
      return thread;
    } catch (error) {
      console.error('❌ Error getting thread:', error);
      throw error;
    }
  }

  async getUserThread(guildId, userId) {
    try {
      const thread = await Modmail.findOne({
        guildId,
        userId,
        status: { $ne: 'closed' },
      });
      return thread;
    } catch (error) {
      console.error('❌ Error getting user thread:', error);
      throw error;
    }
  }

  async getOpenThreads(guildId) {
    try {
      const threads = await Modmail.find({
        guildId,
        status: { $ne: 'closed' },
      }).sort({ updatedAt: -1 });
      return threads;
    } catch (error) {
      console.error('❌ Error getting open threads:', error);
      throw error;
    }
  }
}

export default new ModmailService();
