import mongoose from 'mongoose';

const modmailSchema = new mongoose.Schema({
  threadId: {
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
  status: {
    type: String,
    enum: ['open', 'pending', 'closed', 'archived'],
    default: 'open',
  },
  channelId: {
    type: String,
    default: null,
  },
  dmChannelId: {
    type: String,
    default: null,
  },
  subject: {
    type: String,
    default: null,
  },
  messages: [{
    messageId: String,
    senderId: String,
    senderType: {
      type: String,
      enum: ['user', 'staff', 'system'],
    },
    senderName: String,
    content: String,
    attachments: [String],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  assignedStaff: [
    {
      type: String,
      default: null,
    }
  ],
  tags: [String],
  notes: [{
    staffId: String,
    staffName: String,
    note: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
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

modmailSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Modmail', modmailSchema);
