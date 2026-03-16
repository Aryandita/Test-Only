import { handleCommand } from '../commands/handlers.js';

export function registerInteractionHandler(client, context) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction, context);
        return;
      }

      if (interaction.isButton()) {
        const { musicManager } = context;
        if (!interaction.customId.startsWith('music:')) return;

        switch (interaction.customId) {
          case 'music:skip': {
            const track = await musicManager.skip(interaction.guildId);
            await interaction.reply({
              content: track ? `⏭️ Skip ke **${track.info.title}**` : 'Antrian habis.',
              ephemeral: true
            });
            return;
          }

          case 'music:loop': {
            const enabled = musicManager.toggleLoop(interaction.guildId);
            await interaction.reply({
              content: `🔁 Loop sekarang: **${enabled ? 'Aktif' : 'Mati'}**`,
              ephemeral: true
            });
            return;
          }

          case 'music:stop': {
            await musicManager.stop(interaction.guildId);
            await interaction.reply({ content: '⏹️ Musik dihentikan.', ephemeral: true });
            return;
          }

          default:
            break;
        }
      }
    } catch (error) {
      console.error('[Interaction Error]', error);
      const payload = { content: `Terjadi error: ${error.message}`, ephemeral: true };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  });
}
