const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    default: 'Unknown User',
  },
  balance: {
    type: Number,
    default: 5000,
    min: 0,
  },
  totalEarned: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  // Experience System
  experience: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  // Daily/Weekly System
  lastDailyReward: {
    type: Date,
    default: null,
  },
  dailyRewardStreak: {
    type: Number,
    default: 0,
  },
  lastDailyCheckIn: {
    type: Date,
    default: null,
  },
  dailyCheckInStreak: {
    type: Number,
    default: 0,
  },
  lastWeeklyCheckIn: {
    type: Date,
    default: null,
  },
  weeklyCheckInStreak: {
    type: Number,
    default: 0,
  },
  // Work System
  lastWorkTime: {
    type: Date,
    default: null,
  },
  totalWorked: {
    type: Number,
    default: 0,
  },
  currentJob: {
    type: String,
    default: null,
  },
  // Beg System
  lastBegTime: {
    type: Date,
    default: null,
  },
  totalBegged: {
    type: Number,
    default: 0,
  },
  // Race System
  lastRaceTime: {
    type: Date,
    default: null,
  },
  totalRaces: {
    type: Number,
    default: 0,
  },
  totalRaceWins: {
    type: Number,
    default: 0,
  },
  cars: [{
    id: String,
    name: String,
    price: Number,
    speed: Number,
    ownedAt: Date,
  }],
  activeCar: {
    type: String,
    default: null,
  },
  // Transaction History
  transactions: [{
    type: {
      type: String,
      enum: ['earn', 'spend', 'transfer_send', 'transfer_receive', 'daily_reward', 'gift_receive', 'work', 'beg', 'race', 'daily_checkin', 'weekly_checkin'],
    },
    amount: Number,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    otherUser: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
