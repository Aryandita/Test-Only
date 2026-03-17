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
              components: queue.current ? createMusicControlComponents(queue.autoplay) : [],
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
}
