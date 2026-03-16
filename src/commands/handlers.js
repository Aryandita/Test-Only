import { MessageFlags } from 'discord.js';
import {
  createAiAnswerEmbed,
  createMusicControlComponents,
  createNowPlayingEmbed,
  createStatusEmbed,
  formatQueue
} from '../utils/music-ui.js';

function isOwner(userId, ownerId) {
  return userId === ownerId;
}

export async function handleCommand(interaction, context) {
  await runCommand({
    command: interaction.commandName,
    args: {
      query: interaction.options.getString('query'),
      prompt: interaction.options.getString('prompt')
    },
    context,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    userId: interaction.user.id,
    member: interaction.member,
    shardId: interaction.guild?.shardId,
    reply: (payload) => interaction.reply(payload),
    deferReply: (payload) => interaction.deferReply(payload),
    editReply: (payload) => interaction.editReply(payload)
  });
}

export async function handlePrefixCommand(message, context) {
  const { env } = context;
  if (message.author.bot || !message.content.startsWith(env.prefix)) return;

  const [rawCommand, ...rest] = message.content.slice(env.prefix.length).trim().split(/\s+/);
  const command = (rawCommand ?? '').toLowerCase();

  const payload = {
    command,
    args: {
      query: rest.join(' ').trim(),
      prompt: rest.join(' ').trim()
    },
    context,
    guildId: message.guildId,
    channelId: message.channelId,
    userId: message.author.id,
    member: message.member,
    shardId: message.guild?.shardId,
    reply: (body) => message.reply(normalizePrefixPayload(body)),
    deferReply: async () => {},
    editReply: (body) => message.reply(normalizePrefixPayload(body))
  };

  try {
    await runCommand(payload);
  } catch (error) {
    await message.reply({
      embeds: [
        createStatusEmbed({ color: env.embedHex, title: '❌ Terjadi Error', description: error.message })
      ]
    });
  }
}

function normalizePrefixPayload(body) {
  if (typeof body === 'string') return { content: body };
  const { ephemeral, flags, ...rest } = body;
  return rest;
}

async function runCommand(input) {
  const { command, args, context, guildId, channelId, userId, member, shardId, reply, deferReply, editReply } = input;
  const { musicManager, aiService, env, registerCommands, client } = context;

  switch (command) {
    case 'play': {
      const query = args.query?.trim();
      const voiceChannel = member?.voice?.channel;
      if (!query) {
        await reply({
          embeds: [
            createStatusEmbed({
              color: env.embedHex,
              title: '🎧 Query Kosong',
              description: `Contoh: \`${env.prefix}play let her go\` atau \`/play\``
            })
          ],
          ephemeral: true
        });
        return;
      }

      if (!voiceChannel) {
        await reply({
          embeds: [
            createStatusEmbed({
              color: env.embedHex,
              title: '🚫 Voice Channel Tidak Ditemukan',
              description: 'Masuk voice channel dulu sebelum memutar lagu.'
            })
          ],
          ephemeral: true
        });
        return;
      }

      await deferReply();
      const track = await musicManager.search(query);
      if (!track) {
        await editReply({
          embeds: [
            createStatusEmbed({
              color: env.embedHex,
              title: '🔎 Lagu Tidak Ditemukan',
              description: 'Coba kata kunci lain atau URL yang valid.'
            })
          ]
        });
        return;
      }

      if (!musicManager.shoukaku.players.has(guildId)) {
        await musicManager.join({ guildId, voiceChannelId: voiceChannel.id, shardId });
      }

      const result = await musicManager.enqueue({ guildId, track, textChannelId: channelId });
      const embed = createNowPlayingEmbed({
        track: result.track,
        loopEnabled: result.queue.loop,
        color: env.embedHex,
        queued: result.status === 'queued',
        position: result.position
      });

      await editReply({ embeds: [embed], components: createMusicControlComponents() });
      return;
    }

    case 'skip': {
      await deferReply({ flags: MessageFlags.Ephemeral });
      const track = await musicManager.skip(guildId);
      await editReply({
        embeds: [
          createStatusEmbed({
            color: env.embedHex,
            title: '⏭️ Skip Berhasil',
            description: track ? `Lanjut memutar **${track.info.title}**.` : 'Antrian habis.'
          })
        ]
      });
      return;
    }

    case 'stop': {
      await musicManager.stop(guildId);
      await reply({
        embeds: [
          createStatusEmbed({
            color: env.embedHex,
            title: '⏹️ Playback Dihentikan',
            description: 'Musik dihentikan dan bot keluar dari voice channel.'
          })
        ]
      });
      return;
    }

    case 'queue': {
      const queue = musicManager.getQueue(guildId);
      await reply({
        embeds: [
          createStatusEmbed({
            color: env.embedHex,
            title: '📜 Daftar Antrian',
            description: formatQueue(queue)
          })
        ]
      });
      return;
    }

    case 'loop': {
      const enabled = musicManager.toggleLoop(guildId);
      await reply({
        embeds: [
          createStatusEmbed({
            color: env.embedHex,
            title: '🔁 Status Loop',
            description: enabled ? 'Loop diaktifkan.' : 'Loop dimatikan.'
          })
        ]
      });
      return;
    }

    case 'ai': {
      const prompt = args.prompt?.trim();
      if (!prompt) {
        await reply({
          embeds: [
            createStatusEmbed({
              color: env.embedHex,
              title: '💬 Prompt Kosong',
              description: `Contoh: \`${env.prefix}ai jelaskan setup lavalink\``
            })
          ],
          ephemeral: true
        });
        return;
      }

      await deferReply();
      const answer = await aiService.ask({ userId, prompt });
      await editReply({ embeds: [createAiAnswerEmbed({ color: env.embedHex, answer })] });
      return;
    }

    case 'restart': {
      if (!isOwner(userId, env.ownerId)) {
        await reply({
          embeds: [createStatusEmbed({ color: env.embedHex, title: '🔒 Akses Ditolak', description: 'Khusus owner.' })],
          ephemeral: true
        });
        return;
      }

      await reply({
        embeds: [createStatusEmbed({ color: env.embedHex, title: '♻️ Restart', description: 'Bot akan restart sekarang.' })]
      });
      setTimeout(() => process.exit(0), 1000);
      return;
    }

    case 'owner-stats': {
      if (!isOwner(userId, env.ownerId)) {
        await reply({
          embeds: [createStatusEmbed({ color: env.embedHex, title: '🔒 Akses Ditolak', description: 'Khusus owner.' })],
          ephemeral: true
        });
        return;
      }

      await reply({
        embeds: [
          createStatusEmbed({
            color: env.embedHex,
            title: '👑 Owner Stats',
            description: `Guild: ${client.guilds.cache.size}\nPing: ${client.ws.ping} ms\nUptime: ${Math.floor(process.uptime())} detik`
          })
        ],
        ephemeral: true
      });
      return;
    }

    case 'owner-sync': {
      if (!isOwner(userId, env.ownerId)) {
        await reply({
          embeds: [createStatusEmbed({ color: env.embedHex, title: '🔒 Akses Ditolak', description: 'Khusus owner.' })],
          ephemeral: true
        });
        return;
      }

      await deferReply({ ephemeral: true });
      const count = await registerCommands();
      await editReply({
        embeds: [
          createStatusEmbed({
            color: env.embedHex,
            title: '✅ Sinkronisasi Selesai',
            description: `Total slash command: **${count}**`
          })
        ]
      });
      return;
    }

    case 'help': {
      await reply({
        embeds: [
          createStatusEmbed({
            color: env.embedHex,
            title: '📚 Bantuan Command',
            description: `${env.prefix}play <query>\n${env.prefix}skip\n${env.prefix}stop\n${env.prefix}queue\n${env.prefix}loop\n${env.prefix}ai <prompt>\n${env.prefix}help`
          })
        ]
      });
      return;
    }

    default:
      await reply({
        embeds: [
          createStatusEmbed({
            color: env.embedHex,
            title: '❓ Command Tidak Dikenal',
            description: `Command \`${command}\` tidak tersedia. Coba \`${env.prefix}help\`.`
          })
        ]
      });
  }
}
