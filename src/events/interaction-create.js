import { handleCommand, handlePrefixCommand } from '../commands/handlers.js';
import { createStatusEmbed } from '../utils/music-ui.js';

export function registerInteractionHandler(client, context) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction, context);
        return;
      }

      if (interaction.isButton()) {
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
  });
}
