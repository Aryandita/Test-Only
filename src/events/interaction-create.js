import { handleAiReplyMessage, handleCommand, handleGameButton, handlePrefixCommand } from '../commands/handlers.js';
import { createMusicControlComponents, createNowPlayingEmbed, createStatusEmbed } from '../utils/music-ui.js';

export function registerInteractionHandler(client, context) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction, context);
        return;
      }

      if (interaction.isButton()) {
        if (interaction.customId.startsWith('game:')) {
          await handleGameButton(interaction, context);
          return;
        }

        const { musicManager, env } = context;
        if (!interaction.customId.startsWith('music:')) return;

        switch (interaction.customId) {
          case 'music:skip': {
            const track = await musicManager.skip(interaction.guildId);
            await interaction.reply({
              embeds: [
                createStatusEmbed({
                  color: env.embedHex,
                  title: '⏭️ Skip',
                  description: track ? `Lanjut: **${track.info.title}**` : 'Antrian habis.'
                })
              ],
              ephemeral: true
            });
            return;
          }

          case 'music:loop': {
            const enabled = musicManager.toggleLoop(interaction.guildId);
            await interaction.reply({
              embeds: [
                createStatusEmbed({
                  color: env.embedHex,
                  title: '🔁 Loop',
                  description: enabled ? 'Loop diaktifkan.' : 'Loop dimatikan.'
                })
              ],
              ephemeral: true
            });
            return;
          }

          case 'music:autoplay': {
            const enabled = musicManager.toggleAutoplay(interaction.guildId);
            const queue = musicManager.getQueue(interaction.guildId);
            const maybeEmbed = queue.current
              ? createNowPlayingEmbed({
                  track: queue.current,
                  loopEnabled: queue.loop,
                  autoplayEnabled: queue.autoplay,
                  color: env.embedHex
                })
              : createStatusEmbed({
                  color: env.embedHex,
                  title: '♾️ Autoplay',
                  description: enabled ? 'Autoplay diaktifkan.' : 'Autoplay dimatikan.'
                });

            await interaction.reply({
              embeds: [maybeEmbed],
              components: queue.current ? createMusicControlComponents(queue.autoplay, queue.twentyfourseven, env) : [],
              ephemeral: true
            });
            return;
          }

          case 'music:stop': {
            await musicManager.stop(interaction.guildId);
            await interaction.reply({
              embeds: [
                createStatusEmbed({
                  color: env.embedHex,
                  title: '⏹️ Stop',
                  description: 'Musik dihentikan.'
                })
              ],
              ephemeral: true
            });
            return;
          }

          case 'music:247': {
            const enabled = musicManager.toggle24_7(interaction.guildId);
            await interaction.reply({
              embeds: [
                createStatusEmbed({
                  color: env.embedHex,
                  title: '🔴 24/7 Mode',
                  description: enabled ? '✅ 24/7 mode diaktifkan. Bot akan terus memutar musik!' : '❌ 24/7 mode dimatikan.'
                })
              ],
              ephemeral: true
            });
            return;
          }

          case 'music:queue': {
            const queue = musicManager.getQueue(interaction.guildId);
            const queueList = queue.tracks.length === 0 
              ? 'Queue kosong!' 
              : queue.tracks.slice(0, 10).map((v, i) => `${i + 1}. ${v.info.title}`).join('\n');
            
            await interaction.reply({
              embeds: [
                createStatusEmbed({
                  color: env.embedHex,
                  title: '📋 Queue',
                  description: queueList || 'Queue kosong'
                })
              ],
              ephemeral: true
            });
            return;
          }

          case 'music:nowplaying': {
            const queue = musicManager.getQueue(interaction.guildId);
            if (!queue.current) {
              await interaction.reply({
                embeds: [
                  createStatusEmbed({
                    color: env.embedHex,
                    title: '🎵 Now Playing',
                    description: 'Tidak ada lagu yang sedang diputar.'
                  })
                ],
                ephemeral: true
              });
              return;
            }

            const embed = createNowPlayingEmbed({
              track: queue.current,
              loopEnabled: queue.loop,
              autoplayEnabled: queue.autoplay,
              color: env.embedHex
            });

            await interaction.reply({
              embeds: [embed],
              ephemeral: true
            });
            return;
          }

          case 'music:volume-up': {
            const player = musicManager.shoukaku.players.get(interaction.guildId);
            if (!player) {
              await interaction.reply({
                embeds: [createStatusEmbed({
                  color: env.embedHex,
                  title: '❌ Error',
                  description: 'Player tidak ditemukan.'
                })],
                ephemeral: true
              });
              return;
            }

            const currentVolume = player.volume;
            const newVolume = Math.min(currentVolume + 10, 100);
            await player.setVolume(newVolume);

            await interaction.reply({
              embeds: [
                createStatusEmbed({
                  color: env.embedHex,
                  title: '🔊 Volume',
                  description: `Volume diubah: ${currentVolume}% → ${newVolume}%`
                })
              ],
              ephemeral: true
            });
            return;
          }

          case 'music:volume-down': {
            const player = musicManager.shoukaku.players.get(interaction.guildId);
            if (!player) {
              await interaction.reply({
                embeds: [createStatusEmbed({
                  color: env.embedHex,
                  title: '❌ Error',
                  description: 'Player tidak ditemukan.'
                })],
                ephemeral: true
              });
              return;
            }

            const currentVolume = player.volume;
            const newVolume = Math.max(currentVolume - 10, 0);
            await player.setVolume(newVolume);

            await interaction.reply({
              embeds: [
                createStatusEmbed({
                  color: env.embedHex,
                  title: '🔉 Volume',
                  description: `Volume diubah: ${currentVolume}% → ${newVolume}%`
                })
              ],
              ephemeral: true
            });
            return;
          }

          case 'music:lyrics': {
            const queue = musicManager.getQueue(interaction.guildId);
            if (!queue.current) {
              await interaction.reply({
                embeds: [
                  createStatusEmbed({
                    color: env.embedHex,
                    title: '📝 Lirik',
                    description: 'Tidak ada lagu yang sedang diputar.'
                  })
                ],
                ephemeral: true
              });
              return;
            }

            await interaction.reply({
              embeds: [
                createStatusEmbed({
                  color: env.embedHex,
                  title: '📝 Lirik',
                  description: `Fitur lirik akan segera hadir untuk: **${queue.current.info.title}**`
                })
              ],
              ephemeral: true
            });
            return;
          }

          default:
            break;
        }
      }
    } catch (error) {
      console.error(`❌ [Interaction Error] ${error.message}`);
      const payload = {
        embeds: [
          createStatusEmbed({
            color: context.env.embedHex,
            title: '❌ Error',
            description: error.message
          })
        ],
        ephemeral: true
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  });

  client.on('messageCreate', async (message) => {
    await handlePrefixCommand(message, context);
    await handleAiReplyMessage(message, context);
  });

  // ===== Welcome & Leave Greeting Events =====
  client.on('guildMemberAdd', async (member) => {
    try {
      const { greetingService, env } = context;
      const settings = await greetingService.getGreetingSettings(member.guild.id);

      if (!settings.welcomeEnabled || !settings.welcomeChannelId) return;

      const channel = await member.guild.channels.fetch(settings.welcomeChannelId).catch(() => null);
      if (!channel?.isTextBased()) return;

      const language = settings.guildLanguage || 'id';
      const embed = await greetingService.generateWelcomeEmbed(member, member.guild, language);
      const customMessage = greetingService.replaceVariables(settings.welcomeMessage, member, member.guild);

      await channel.send({
        content: customMessage,
        embeds: [embed]
      }).catch(error => console.error('❌ Error sending welcome message:', error));
    } catch (error) {
      console.error('❌ Error handling guildMemberAdd:', error);
    }
  });

  // ===== Leave Greeting Event =====
  client.on('guildMemberRemove', async (member) => {
    try {
      const { greetingService, env } = context;
      const settings = await greetingService.getGreetingSettings(member.guild.id);

      if (!settings.leaveEnabled || !settings.leaveChannelId) return;

      const channel = await member.guild.channels.fetch(settings.leaveChannelId).catch(() => null);
      if (!channel?.isTextBased()) return;

      const language = settings.guildLanguage || 'id';
      const embed = await greetingService.generateLeaveEmbed(member.user, member.guild, language);
      const customMessage = greetingService.replaceVariables(settings.leaveMessage, member, member.guild);

      await channel.send({
        content: customMessage,
        embeds: [embed]
      }).catch(error => console.error('❌ Error sending leave message:', error));
    } catch (error) {
      console.error('❌ Error handling guildMemberRemove:', error);
    }
  });

  // ===== Server Boost Event =====
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
      const { boostService, env } = context;
      
      // Check if boost status changed
      if (!oldMember.premiumSince && newMember.premiumSince) {
        // New boost detected 🚀
        const boostSettings = await boostService.getBoostSettings(newMember.guild.id);
        if (!boostSettings.boostAnnouncementEnabled || !boostSettings.boostChannelId) return;

        const channel = await newMember.guild.channels.fetch(boostSettings.boostChannelId).catch(() => null);
        if (!channel?.isTextBased()) return;

        const language = boostSettings.guildLanguage || 'id';
        const embed = await boostService.generateBoostEmbed(newMember, newMember.guild, newMember.guild.premiumTier || 1, language);
        await boostService.trackBoost(newMember.guild.id, newMember.id, newMember.user.username, newMember.guild.premiumTier || 1);

        // Assign boost reward role if configured
        if (boostSettings.boostRewardRoleId) {
          const role = await newMember.guild.roles.fetch(boostSettings.boostRewardRoleId).catch(() => null);
          if (role) {
            await newMember.roles.add(role, 'Server boost reward').catch(() => null);
          }
        }

        await channel.send({ embeds: [embed] }).catch(error => console.error('❌ Error sending boost message:', error));
      }
    } catch (error) {
      console.error('❌ Error handling guildMemberUpdate:', error);
    }
  });

  // ===== Temporary Voice Channel Events =====
  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      const { tempVoiceService, env } = context;

      // User joined a voice channel
      if (!oldState.channel && newState.channel) {
        const tempVoiceSettings = await tempVoiceService.getTempVoiceSettings(newState.guild.id);
        if (!tempVoiceSettings.tempVoiceEnabled || !tempVoiceSettings.tempVoiceParentChannelId) return;

        // Check if it's the temp voice creator channel
        if (newState.channel.id === tempVoiceSettings.tempVoiceParentChannelId) {
          const tempChannel = await tempVoiceService.createTempVoice(
            newState.guild.id,
            newState.member.id,
            newState.member.user.username,
            tempVoiceSettings.tempVoiceParentChannelId,
            newState.channel
          );

          // Move user to new temp channel
          await newState.member.voice.setChannel(tempChannel).catch(error => 
            console.error('❌ Error moving user to temp voice:', error)
          );
        }
      }

      // User left a voice channel
      if (oldState.channel && !newState.channel) {
        const isTempVoice = await tempVoiceService.isTempVoice(oldState.channel.id);
        if (isTempVoice) {
          await tempVoiceService.updateActivity(oldState.channel.id);

          // Check if channel is now empty
          if (oldState.channel.members.size === 0) {
            await tempVoiceService.deleteTempVoice(oldState.channel.id, oldState.guild);
          }
        }
      }

      // User switched channels
      if (oldState.channel && newState.channel && oldState.channelId !== newState.channelId) {
        // Update activity for old channel if it was temp voice
        const isOldTempVoice = await tempVoiceService.isTempVoice(oldState.channel.id);
        if (isOldTempVoice) {
          await tempVoiceService.updateActivity(oldState.channel.id);
          if (oldState.channel.members.size === 0) {
            await tempVoiceService.deleteTempVoice(oldState.channel.id, oldState.guild);
          }
        }

        // Check if new channel is the temp voice creator
        const tempVoiceSettings = await tempVoiceService.getTempVoiceSettings(newState.guild.id);
        if (tempVoiceSettings.tempVoiceEnabled && newState.channel.id === tempVoiceSettings.tempVoiceParentChannelId) {
          const tempChannel = await tempVoiceService.createTempVoice(
            newState.guild.id,
            newState.member.id,
            newState.member.user.username,
            tempVoiceSettings.tempVoiceParentChannelId,
            newState.channel
          );

          await newState.member.voice.setChannel(tempChannel).catch(error =>
            console.error('❌ Error moving user to temp voice:', error)
          );
        }
      }
    } catch (error) {
      console.error('❌ Error handling voiceStateUpdate:', error);
    }
  });
}
