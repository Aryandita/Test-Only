import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  guildName: {
    type: String,
    default: 'Unknown Server',
  },
  // Welcome System
  welcomeEnabled: {
    type: Boolean,
    default: false,
  },
  welcomeChannelId: {
    type: String,
    default: null,
  },
  welcomeMessage: {
    type: String,
    default: 'Welcome {user} to {server}! 👋',
  },
  welcomeImageEnabled: {
    type: Boolean,
    default: true,
  },
  // Ticket System
  ticketEnabled: {
    type: Boolean,
    default: false,
  },
  ticketCategoryId: {
    type: String,
    default: null,
  },
  ticketModRoleId: {
    type: String,
    default: null,
  },
  // Modmail System
  modmailEnabled: {
    type: Boolean,
    default: false,
  },
  modmailCategoryId: {
    type: String,
    default: null,
  },
  modmailLogChannelId: {
    type: String,
    default: null,
  },
  modmailStaffRoleId: {
    type: String,
    default: null,
  },
  // Levelling System
  levellingEnabled: {
    type: Boolean,
    default: false,
  },
  levelMessageChannelId: {
    type: String,
    default: null,
  },
  levelMessageEnabled: {
    type: Boolean,
    default: true,
  },
  levelMessage: {
    type: String,
    default: 'Congratulations {user}! You reached level {level}! 🎉',
  },
  levelRoles: [{
    level: Number,
    roleId: String,
  }],
  // Music System
  musicLevelingEnabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

guildSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Guild', guildSchema);
