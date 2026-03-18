const User = require('../database/models/User');

// Work Jobs Data
const JOBS = {
  ojek: { name: '🏍️ Ojek Online', baseReward: 15000, icon: '🏍️' },
  designer: { name: '🎨 Graphic Designer', baseReward: 45000, icon: '🎨' },
  teacher: { name: '👨‍🏫 Guru', baseReward: 35000, icon: '👨‍🏫' },
  engineer: { name: '⚙️ Software Engineer', baseReward: 75000, icon: '⚙️' },
  doctor: { name: '👨‍⚕️ Dokter', baseReward: 85000, icon: '👨‍⚕️' },
  politician: { name: '🤵 Politisi', baseReward: 150000, icon: '🤵' },
};

// Car Data
const CARS = {
  civic: { name: 'Honda Civic', price: 50000, speed: 150, icon: '🚗' },
  fortuner: { name: 'Toyota Fortuner', price: 75000, speed: 120, icon: '🚙' },
  lamborghini: { name: 'Lamborghini', price: 200000, speed: 300, icon: '🏎️' },
  bugatti: { name: 'Bugatti Veyron', price: 500000, speed: 380, icon: '🏁' },
  ferrari: { name: 'Ferrari 458', price: 350000, speed: 370, icon: '🔴' },
};

class EconomyService {
  static async getUser(userId, username = 'Unknown User') {
    try {
      let user = await User.findOne({ userId });
      
      if (!user) {
        user = new User({ userId, username });
        await user.save();
      }
      
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Experience & Level System
  static calculateXPMultiplier(level) {
    return 1 + (level - 1) * 0.0001; // +0.01% per level
  }

  static addExperience(earning, level) {
    const baseXP = 10;
    return Math.floor(baseXP * (level / 10));
  }

  // Add Balance dengan XP calculation
  static async addBalance(userId, amount, description = 'Earned', isWork = false) {
    try {
      const user = await this.getUser(userId);
      if (!user) return null;

      let finalAmount = amount;
      if (isWork) {
        const multiplier = this.calculateXPMultiplier(user.level);
        finalAmount = Math.floor(amount * multiplier);
      }

      user.balance += finalAmount;
      user.totalEarned += finalAmount;
      
      // Add XP
      user.experience += this.addExperience(finalAmount, user.level);
      
      // Level up check
      const xpPerLevel = 500;
      if (user.experience >= xpPerLevel) {
        user.level += 1;
        user.experience -= xpPerLevel;
      }

      user.transactions.push({
        type: 'earn',
        amount: finalAmount,
        description,
        timestamp: new Date(),
      });

      await user.save();
      return user;
    } catch (error) {
      console.error('Error adding balance:', error);
      return null;
    }
  }

  static async removeBalance(userId, amount, description = 'Spent') {
    try {
      const user = await this.getUser(userId);
      if (!user) return null;
      if (user.balance < amount) return null;

      user.balance -= amount;
      user.totalSpent += amount;
      
      user.transactions.push({
        type: 'spend',
        amount,
        description,
        timestamp: new Date(),
      });

      await user.save();
      return user;
    } catch (error) {
      console.error('Error removing balance:', error);
      return null;
    }
  }

  // Daily Check-In System
  static async dailyCheckIn(userId, username) {
    try {
      const user = await this.getUser(userId, username);
      if (!user) return null;

      const now = new Date();
      const lastCheckIn = user.lastDailyCheckIn;

      if (lastCheckIn) {
        const timeDiff = now - lastCheckIn;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          return {
            canCheckIn: false,
            hoursLeft: Math.ceil(24 - hoursDiff),
            user,
          };
        }
      }

      const reward = 2500 + (user.dailyCheckInStreak * 250);
      user.balance += reward;
      user.totalEarned += reward;
      user.dailyCheckInStreak += 1;
      user.lastDailyCheckIn = now;
      user.experience += 50;

      user.transactions.push({
        type: 'daily_checkin',
        amount: reward,
        description: `Daily Check-in (Hari ke-${user.dailyCheckInStreak})`,
        timestamp: now,
      });

      await user.save();

      return {
        canCheckIn: true,
        reward,
        streak: user.dailyCheckInStreak,
        user,
      };
    } catch (error) {
      console.error('Error daily check-in:', error);
      return null;
    }
  }

  // Weekly Check-In System
  static async weeklyCheckIn(userId, username) {
    try {
      const user = await this.getUser(userId, username);
      if (!user) return null;

      const now = new Date();
      const lastWeekly = user.lastWeeklyCheckIn;

      if (lastWeekly) {
        const timeDiff = now - lastWeekly;
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

        if (daysDiff < 7) {
          return {
            canCheckIn: false,
            daysLeft: Math.ceil(7 - daysDiff),
            user,
          };
        }
      }

      const reward = 50000 + (user.weeklyCheckInStreak * 5000);
      user.balance += reward;
      user.totalEarned += reward;
      user.weeklyCheckInStreak += 1;
      user.lastWeeklyCheckIn = now;
      user.experience += 500;

      user.transactions.push({
        type: 'weekly_checkin',
        amount: reward,
        description: `Weekly Check-in (Minggu ke-${user.weeklyCheckInStreak})`,
        timestamp: now,
      });

      await user.save();

      return {
        canCheckIn: true,
        reward,
        streak: user.weeklyCheckInStreak,
        user,
      };
    } catch (error) {
      console.error('Error weekly check-in:', error);
      return null;
    }
  }

  // Work System
  static async work(userId, username) {
    try {
      const user = await this.getUser(userId, username);
      if (!user) return null;

      const now = new Date();
      const lastWork = user.lastWorkTime;

      if (lastWork) {
        const timeDiff = now - lastWork;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 1) {
          return {
            canWork: false,
            minutesLeft: Math.ceil((1 - hoursDiff) * 60),
            user,
          };
        }
      }

      const jobs = Object.keys(JOBS);
      const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
      const jobData = JOBS[randomJob];
      const multiplier = this.calculateXPMultiplier(user.level);
      const reward = Math.floor(jobData.baseReward * multiplier);

      user.balance += reward;
      user.totalEarned += reward;
      user.totalWorked += 1;
      user.lastWorkTime = now;
      user.currentJob = randomJob;
      user.experience += 150;

      // Check level up
      const xpPerLevel = 500;
      if (user.experience >= xpPerLevel) {
        user.level += 1;
        user.experience -= xpPerLevel;
      }

      user.transactions.push({
        type: 'work',
        amount: reward,
        description: `${jobData.name} (Level ${user.level})`,
        timestamp: now,
      });

      await user.save();

      return {
        canWork: true,
        job: randomJob,
        jobName: jobData.name,
        reward,
        newLevel: user.level,
        user,
      };
    } catch (error) {
      console.error('Error working:', error);
      return null;
    }
  }

  // Beg System
  static async beg(userId, username) {
    try {
      const user = await this.getUser(userId, username);
      if (!user) return null;

      const now = new Date();
      const lastBeg = user.lastBegTime;

      if (lastBeg) {
        const timeDiff = now - lastBeg;
        const minutesDiff = timeDiff / (1000 * 60);

        if (minutesDiff < 30) {
          return {
            canBeg: false,
            minutesLeft: Math.ceil(30 - minutesDiff),
            user,
          };
        }
      }

      const rewards = [1000, 1500, 2000, 2500, 3000];
      const reward = rewards[Math.floor(Math.random() * rewards.length)];

      user.balance += reward;
      user.totalEarned += reward;
      user.totalBegged += 1;
      user.lastBegTime = now;
      user.experience += 25;

      user.transactions.push({
        type: 'beg',
        amount: reward,
        description: 'Meminta-minta ke orang lewat 🥺',
        timestamp: now,
      });

      await user.save();

      return {
        canBeg: true,
        reward,
        user,
      };
    } catch (error) {
      console.error('Error begging:', error);
      return null;
    }
  }

  // Race System
  static async race(userId, username) {
    try {
      const user = await this.getUser(userId, username);
      if (!user) return null;

      const now = new Date();
      const lastRace = user.lastRaceTime;

      if (lastRace) {
        const timeDiff = now - lastRace;
        const minutesDiff = timeDiff / (1000 * 60);

        if (minutesDiff < 45) {
          return {
            canRace: false,
            minutesLeft: Math.ceil(45 - minutesDiff),
            user,
          };
        }
      }

      if (!user.activeCar) {
        return {
          canRace: false,
          reason: 'Kamu perlu membeli mobil dulu! Gunakan `/shop` untuk membeli.',
          user,
        };
      }

      const chance = Math.random();
      const won = chance > 0.3; // 70% chance to win
      const raceReward = won ? 35000 : 0;

      user.lastRaceTime = now;
      user.totalRaces += 1;
      if (won) user.totalRaceWins += 1;

      if (won) {
        const multiplier = this.calculateXPMultiplier(user.level);
        const finalReward = Math.floor(raceReward * multiplier);
        user.balance += finalReward;
        user.totalEarned += finalReward;
        user.experience += 200;

        user.transactions.push({
          type: 'race',
          amount: finalReward,
          description: `🏁 Race Menang!`,
          timestamp: now,
        });
      } else {
        user.experience += 50;
        user.transactions.push({
          type: 'race',
          amount: 0,
          description: `🏁 Race Kalah 😢`,
          timestamp: now,
        });
      }

      // Check level up
      const xpPerLevel = 500;
      if (user.experience >= xpPerLevel) {
        user.level += 1;
        user.experience -= xpPerLevel;
      }

      await user.save();

      return {
        canRace: true,
        won,
        reward: won ? Math.floor(raceReward * this.calculateXPMultiplier(user.level)) : 0,
        totalWins: user.totalRaceWins,
        totalRaces: user.totalRaces,
        user,
      };
    } catch (error) {
      console.error('Error racing:', error);
      return null;
    }
  }

  // Transfer System
  static async transferBalance(fromUserId, toUserId, amount, fromUsername, toUsername) {
    try {
      const fromUser = await this.getUser(fromUserId, fromUsername);
      const toUser = await this.getUser(toUserId, toUsername);

      if (!fromUser || !toUser) return null;
      if (fromUser.balance < amount) return null;
      if (amount <= 0) return null;

      fromUser.balance -= amount;
      fromUser.totalSpent += amount;
      fromUser.transactions.push({
        type: 'transfer_send',
        amount,
        description: `Transfer ke ${toUsername || toUserId}`,
        timestamp: new Date(),
        otherUser: toUserId,
      });

      toUser.balance += amount;
      toUser.totalEarned += amount;
      toUser.transactions.push({
        type: 'transfer_receive',
        amount,
        description: `Transfer dari ${fromUsername || fromUserId}`,
        timestamp: new Date(),
        otherUser: fromUserId,
      });

      await Promise.all([fromUser.save(), toUser.save()]);
      return { fromUser, toUser };
    } catch (error) {
      console.error('Error transferring balance:', error);
      return null;
    }
  }

  // Shop / Buy Car
  static async buyCar(userId, username, carId) {
    try {
      const user = await this.getUser(userId, username);
      if (!user) return null;

      const car = CARS[carId];
      if (!car) return { canBuy: false, reason: 'Mobil tidak ditemukan' };

      const alreadyOwned = user.cars.find(c => c.id === carId);
      if (alreadyOwned) return { canBuy: false, reason: 'Kamu sudah memiliki mobil ini!' };

      if (user.balance < car.price) {
        return { canBuy: false, reason: 'Saldo tidak cukup' };
      }

      user.balance -= car.price;
      user.totalSpent += car.price;

      user.cars.push({
        id: carId,
        name: car.name,
        price: car.price,
        speed: car.speed,
        ownedAt: new Date(),
      });

      if (!user.activeCar) {
        user.activeCar = carId;
      }

      user.transactions.push({
        type: 'spend',
        amount: car.price,
        description: `Membeli mobil ${car.name}`,
        timestamp: new Date(),
      });

      await user.save();

      return {
        canBuy: true,
        car: car.name,
        newBalance: user.balance,
        user,
      };
    } catch (error) {
      console.error('Error buying car:', error);
      return null;
    }
  }

  // Get balance
  static async getBalance(userId) {
    try {
      const user = await User.findOne({ userId });
      return user ? user.balance : 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  // Get leaderboard
  static async getLeaderboard(limit = 10) {
    try {
      const leaderboard = await User.find()
        .sort({ balance: -1 })
        .limit(limit)
        .select('userId username balance totalEarned level');
      
      return leaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Get user rank
  static async getUserRank(userId) {
    try {
      const userBalance = await this.getBalance(userId);
      const userRank = await User.countDocuments({
        balance: { $gt: userBalance },
      });

      return userRank + 1;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return 0;
    }
  }

  // Get transaction history
  static async getTransactionHistory(userId, limit = 5) {
    try {
      const user = await User.findOne({ userId });
      if (!user) return [];

      return user.transactions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  // Get cars list
  static getCarsList() {
    return CARS;
  }

  // Get jobs list
  static getJobsList() {
    return JOBS;
  }
}

module.exports = EconomyService;
