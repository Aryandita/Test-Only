import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['support', 'report', 'appeal', 'suggestion', 'other'],
    default: 'support',
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'closed', 'resolved'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  channelId: {
    type: String,
    default: null,
  },
  responses: [{
    userId: String,
    username: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  assignedTo: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  closedAt: {
    type: Date,
    default: null,
  },
  closedBy: {
    type: String,
    default: null,
  },
  closeReason: {
    type: String,
    default: null,
  },
});

ticketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Ticket', ticketSchema);
