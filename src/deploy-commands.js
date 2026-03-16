import { REST, Routes } from 'discord.js';
import { commandDefinitions } from './commands/definitions.js';
import { env } from './config/env.js';

export async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(env.token);

  if (env.guildId) {
    await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), {
      body: commandDefinitions
    });
    return commandDefinitions.length;
  }

  await rest.put(Routes.applicationCommands(env.clientId), { body: commandDefinitions });
  return commandDefinitions.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  deployCommands()
    .then((count) => {
      console.log(`Slash command terpasang: ${count}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Gagal deploy commands:', error);
      process.exit(1);
    });
}
