// Economy command handlers
import EconomyService from '../services/economy-service.js';
import {
  createDailyCheckInEmbed,
  createWeeklyCheckInEmbed,
  createWorkRewardEmbed,
  createBegRewardEmbed,
  createRaceResultEmbed,
  createShopEmbed,
  createBuyCarEmbed,
  createStatusEmbed,
} from '../utils/music-ui.js';

export async function handleEconomyCommand(command, payload) {
  const { userId, member, args, guildId, editReply, deferReply, context } = payload;
  const { env } = context;
  let username = member?.user?.username || member?.displayName || 'User';

  try {
    switch (command) {
      case 'dailycheckin': {
        await deferReply();
        const result = await EconomyService.dailyCheckIn(userId, username);
        
        if (!result.success) {
          return await editReply({
            embeds: [
              createStatusEmbed({
                title: '⏱️ Daily Check-In',
                description: result.message,
                color: env.embedHex,
              }),
            ],
          });
        }

        const embed = createDailyCheckInEmbed(result.reward, result.streak, env.embedHex);
        return await editReply({ embeds: [embed] });
      }

      case 'weeklycheckin': {
        await deferReply();
        const result = await EconomyService.weeklyCheckIn(userId, username);
        
        if (!result.success) {
          return await editReply({
            embeds: [
              createStatusEmbed({
                title: '📅 Weekly Check-In',
                description: result.message,
                color: env.embedHex,
              }),
            ],
          });
        }

        const embed = createWeeklyCheckInEmbed(result.reward, result.streak, env.embedHex);
        return await editReply({ embeds: [embed] });
      }

      case 'work': {
        await deferReply();
        const result = await EconomyService.work(userId, username);
        
        if (!result.success) {
          return await editReply({
            embeds: [
              createStatusEmbed({
                title: '💼 Work',
                description: result.message,
                color: env.embedHex,
              }),
            ],
          });
        }

        const embed = createWorkRewardEmbed(
          result.jobName,
          result.salaryEarned,
          result.level,
          result.totalWorked,
          env.embedHex
        );
        return await editReply({ embeds: [embed] });
      }

      case 'beg': {
        await deferReply();
        const result = await EconomyService.beg(userId, username);
        
        if (!result.success) {
          return await editReply({
            embeds: [
              createStatusEmbed({
                title: '🤲 Meminta',
                description: result.message,
                color: env.embedHex,
              }),
            ],
          });
        }

        const embed = createBegRewardEmbed(result.amountBegged, result.totalBegged, env.embedHex);
        return await editReply({ embeds: [embed] });
      }

      case 'race': {
        await deferReply();
        const result = await EconomyService.race(userId, username);
        
        if (!result.success) {
          return await editReply({
            embeds: [
              createStatusEmbed({
                title: '🏁 Race',
                description: result.message,
                color: env.embedHex,
              }),
            ],
          });
        }

        const embed = createRaceResultEmbed(
          result.won,
          result.carName,
          result.rewardEarned,
          result.raceCount,
          result.winCount,
          env.embedHex
        );
        return await editReply({ embeds: [embed] });
      }

      case 'shop': {
        await deferReply();
        const action = args.shopAction || 'list';
        
        if (action === 'list') {
          const embed = createShopEmbed(env.embedHex);
          return await editReply({
            embeds: [embed],
          });
        }

        if (action === 'buy') {
          const carId = args.carId;
          if (!carId) {
            return await editReply({
              embeds: [
                createStatusEmbed({
                  title: '🚗 Shop',
                  description: '⚠️ Pilih mobil yang ingin dibeli!',
                  color: env.embedHex,
                }),
              ],
            });
          }

          const result = await EconomyService.buyCar(userId, username, carId);
          
          if (!result.success) {
            return await editReply({
              embeds: [
                createStatusEmbed({
                  title: '🚗 Shop',
                  description: result.message,
                  color: env.embedHex,
                }),
              ],
            });
          }

          const embed = createBuyCarEmbed(
            result.carName,
            result.price,
            result.newBalance,
            env.embedHex
          );
          return await editReply({ embeds: [embed] });
        }

        return await editReply({
          embeds: [
            createStatusEmbed({
              title: '🚗 Shop',
              description: '❌ Aksi tidak dikenali!',
              color: env.embedHex,
            }),
          ],
        });
      }
    }
  } catch (error) {
    console.error(`Economy command error for ${command}:`, error);
    return await editReply({
      embeds: [
        createStatusEmbed({
          title: '⚠️ Error',
          description: 'Terjadi kesalahan saat memproses perintah.',
          color: 0xff0000,
        }),
      ],
    });
  }
}
