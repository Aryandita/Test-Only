import { v4 as uuidv4 } from 'uuid';
import Ticket from '../database/models/Ticket.js';
import Guild from '../database/models/Guild.js';

export class TicketService {
  async createTicket(guildId, userId, username, category, subject, description) {
    try {
      const ticketId = `TK-${uuidv4().substring(0, 8).toUpperCase()}`;

      const ticket = new Ticket({
        ticketId,
        guildId,
        userId,
        username,
        category,
        subject,
        description,
        status: 'open',
      });

      await ticket.save();
      return ticket;
    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      throw error;
    }
  }

  async addResponse(ticketId, userId, username, message) {
    try {
      const ticket = await Ticket.findOne({ ticketId });
      if (!ticket) throw new Error('Ticket not found');

      ticket.responses.push({
        userId,
        username,
        message,
        timestamp: new Date(),
      });

      await ticket.save();
      return ticket;
    } catch (error) {
      console.error('❌ Error adding response:', error);
      throw error;
    }
  }

  async closeTicket(ticketId, closedBy, reason) {
    try {
      const ticket = await Ticket.findOne({ ticketId });
      if (!ticket) throw new Error('Ticket not found');

      ticket.status = 'closed';
      ticket.closedAt = new Date();
      ticket.closedBy = closedBy;
      ticket.closeReason = reason;

      await ticket.save();
      return ticket;
    } catch (error) {
      console.error('❌ Error closing ticket:', error);
      throw error;
    }
  }

  async updateStatus(ticketId, status) {
    try {
      const ticket = await Ticket.findOne({ ticketId });
      if (!ticket) throw new Error('Ticket not found');

      ticket.status = status;
      await ticket.save();
      return ticket;
    } catch (error) {
      console.error('❌ Error updating ticket status:', error);
      throw error;
    }
  }

  async getTicket(ticketId) {
    try {
      const ticket = await Ticket.findOne({ ticketId });
      return ticket;
    } catch (error) {
      console.error('❌ Error getting ticket:', error);
      throw error;
    }
  }

  async getUserTickets(userId, guildId) {
    try {
      const tickets = await Ticket.find({ userId, guildId })
        .sort({ createdAt: -1 });
      return tickets;
    } catch (error) {
      console.error('❌ Error getting user tickets:', error);
      throw error;
    }
  }

  async getOpenTickets(guildId) {
    try {
      const tickets = await Ticket.find({
        guildId,
        status: { $ne: 'closed' },
      }).sort({ createdAt: -1 });
      return tickets;
    } catch (error) {
      console.error('❌ Error getting open tickets:', error);
      throw error;
    }
  }
}

export default new TicketService();
