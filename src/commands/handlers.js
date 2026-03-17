import { MessageFlags } from 'discord.js';
import {
  createAiAnswerEmbed,
  createMusicControlComponents,
  createNowPlayingEmbed,
  createStatusEmbed,
  formatQueue
} from '../utils/music-ui.js';

const tttGames = new Map();
const aiThreads = new Map();
const RPS_CHOICES = ['rock', 'paper', 'scissors'];
const RPS_EMOJI = { rock: '✊', paper: '✋', scissors: '✌️' };

function isOwner(userId, ownerId) {
  return userId === ownerId;
}

export async function handleCommand(interaction, context) {
  await runCommand({
    command: interaction.commandName,
    args: {
      query: interaction.options.getString('query'),
      prompt: interaction.options.getString('prompt'),
      rpsChoice: interaction.options.getString('pilihan'),
      tttAction: interaction.options.getString('aksi'),
      tttPosition: interaction.options.getInteger('posisi')
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
      prompt: rest.join(' ').trim(),
      rpsChoice: rest[0]?.toLowerCase(),
      tttAction: rest[0]?.toLowerCase(),
      tttPosition: Number(rest[0])
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

export async function handleAiReplyMessage(message, context) {
  if (message.author.bot || !message.reference?.messageId) return;

  const replied = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
  if (!replied || !replied.author?.bot) return;

  const marker = replied.embeds?.[0]?.footer?.text;
  if (!marker?.startsWith('AI_THREAD:')) return;

  const originalUserId = marker.split(':')[1];
  if (originalUserId !== message.author.id) return;

  const threadKey = `${message.channelId}:${message.author.id}`;
  const existing = aiThreads.get(threadKey) ?? [];
  const prompt = message.content.trim();
  if (!prompt) return;

  const answer = await context.aiService.ask({ userId: message.author.id, prompt, history: existing });
  aiThreads.set(threadKey, [...existing, { role: 'user', text: prompt }, { role: 'assistant', text: answer }].slice(-8));

  await message.reply({ embeds: [createAiAnswerEmbed({ color: context.env.embedHex, answer, userId: message.author.id })] });
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
        autoplayEnabled: result.queue.autoplay,
        color: env.embedHex,
        queued: result.status === 'queued',
        position: result.position
      });

      await editReply({ embeds: [embed], components: createMusicControlComponents(result.queue.autoplay) });
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
          createStatusEmbed({ color: env.embedHex, title: '🔁 Status Loop', description: enabled ? 'Loop diaktifkan.' : 'Loop dimatikan.' })
        ]
      });
      return;
    }

    case 'autoplay': {
      const enabled = musicManager.toggleAutoplay(guildId);
      await reply({
        embeds: [
          createStatusEmbed({ color: env.embedHex, title: '♾️ Status Autoplay', description: enabled ? 'Autoplay diaktifkan.' : 'Autoplay dimatikan.' })
        ]
      });
      return;
    }

    case 'ai': {
      const prompt = args.prompt?.trim();
      if (!prompt) {
        await reply({
          embeds: [createStatusEmbed({ color: env.embedHex, title: '💬 Prompt Kosong', description: `Contoh: \`${env.prefix}ai jelaskan setup lavalink\`` })],
          ephemeral: true
        });
        return;
      }

      await deferReply();
      const threadKey = `${channelId}:${userId}`;
      const history = aiThreads.get(threadKey) ?? [];
      const answer = await aiService.ask({ userId, prompt, history });
      aiThreads.set(threadKey, [...history, { role: 'user', text: prompt }, { role: 'assistant', text: answer }].slice(-8));
      await editReply({ embeds: [createAiAnswerEmbed({ color: env.embedHex, answer, userId })] });
      return;
    }

    case 'rps': {
      const playerChoice = normalizeRpsChoice(args.rpsChoice);
      if (!playerChoice) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '✊ RPS', description: `Pilih: rock/paper/scissors. Contoh: \`${env.prefix}rps rock\`` })], ephemeral: true });
        return;
      }
      const botChoice = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
      const result = resolveRpsResult(playerChoice, botChoice);
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '🕹️ Rock Paper Scissors', description: `Kamu: ${RPS_EMOJI[playerChoice]} **${playerChoice}**\nBot: ${RPS_EMOJI[botChoice]} **${botChoice}**\n\nHasil: **${result}**` })] });
      return;
    }

    case 'tictactoe': {
      const rawAction = args.tttAction;
      const tttAction = rawAction === 'start' || rawAction === 'move' ? rawAction : Number.isInteger(args.tttPosition) ? 'move' : 'start';
      const position = Number.isInteger(args.tttPosition) ? args.tttPosition : Number(rawAction);

      if (tttAction === 'start') {
        tttGames.set(channelId, { board: Array(9).fill(null), playerId: userId });
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❎ Tic Tac Toe Dimulai', description: `${renderBoard(tttGames.get(channelId).board)}\nGiliran kamu dulu (X). Gunakan \`/tictactoe aksi:move posisi:1-9\` atau \`${env.prefix}tictactoe 5\`.` })] });
        return;
      }

      const game = tttGames.get(channelId);
      if (!game) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❎ Belum Ada Game', description: `Mulai dulu dengan \`/tictactoe aksi:start\` atau \`${env.prefix}tictactoe start\`.` })], ephemeral: true });
        return;
      }
      if (game.playerId !== userId) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '⛔ Game Sedang Dipakai', description: 'Game di channel ini sedang dimainkan user lain.' })], ephemeral: true });
        return;
      }
      if (!Number.isInteger(position) || position < 1 || position > 9) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '🔢 Posisi Tidak Valid', description: 'Posisi harus 1 sampai 9.' })], ephemeral: true });
        return;
      }

      const idx = position - 1;
      if (game.board[idx]) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '⚠️ Kotak Terisi', description: 'Pilih kotak lain.' })], ephemeral: true });
        return;
      }

      game.board[idx] = 'X';
      let winner = checkTttWinner(game.board);
      if (winner || isBoardFull(game.board)) {
        tttGames.delete(channelId);
        await reply({ embeds: [createTttResultEmbed(game.board, winner, env.embedHex)] });
        return;
      }

      const botMove = chooseBotMove(game.board);
      game.board[botMove] = 'O';
      winner = checkTttWinner(game.board);
      if (winner || isBoardFull(game.board)) {
        tttGames.delete(channelId);
        await reply({ embeds: [createTttResultEmbed(game.board, winner, env.embedHex)] });
        return;
      }

      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❎ Tic Tac Toe', description: `${renderBoard(game.board)}\nGiliran kamu (X).` })] });
      return;
    }

    case 'restart': {
      if (!isOwner(userId, env.ownerId)) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '🔒 Akses Ditolak', description: 'Khusus owner.' })], ephemeral: true });
        return;
      }
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '♻️ Restart', description: 'Bot akan restart sekarang.' })] });
      setTimeout(() => process.exit(0), 1000);
      return;
    }

    case 'owner-stats': {
      if (!isOwner(userId, env.ownerId)) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '🔒 Akses Ditolak', description: 'Khusus owner.' })], ephemeral: true });
        return;
      }
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '👑 Owner Stats', description: `Guild: ${client.guilds.cache.size}\nPing: ${client.ws.ping} ms\nUptime: ${Math.floor(process.uptime())} detik` })], ephemeral: true });
      return;
    }

    case 'owner-sync': {
      if (!isOwner(userId, env.ownerId)) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '🔒 Akses Ditolak', description: 'Khusus owner.' })], ephemeral: true });
        return;
      }
      await deferReply({ ephemeral: true });
      const count = await registerCommands();
      await editReply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '✅ Sinkronisasi Selesai', description: `Total slash command: **${count}**` })] });
      return;
    }

    case 'help': {
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '📚 Bantuan Command', description: `${env.prefix}play <query>\n${env.prefix}skip\n${env.prefix}stop\n${env.prefix}queue\n${env.prefix}loop\n${env.prefix}autoplay\n${env.prefix}ai <prompt>\n${env.prefix}rps <rock/paper/scissors>\n${env.prefix}tictactoe start\n${env.prefix}tictactoe <1-9>\n${env.prefix}help` })] });
      return;
    }

    default:
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❓ Command Tidak Dikenal', description: `Command \`${command}\` tidak tersedia. Coba \`${env.prefix}help\`.` })] });
  }
}

function normalizeRpsChoice(input) {
  const value = input?.toLowerCase();
  if (!value) return null;
  if (value === 'batu') return 'rock';
  if (value === 'kertas') return 'paper';
  if (value === 'gunting') return 'scissors';
  return RPS_CHOICES.includes(value) ? value : null;
}

function resolveRpsResult(player, bot) {
  if (player === bot) return 'Seri 🤝';
  if ((player === 'rock' && bot === 'scissors') || (player === 'paper' && bot === 'rock') || (player === 'scissors' && bot === 'paper')) {
    return 'Kamu menang 🎉';
  }
  return 'Bot menang 🤖';
}

function renderBoard(board) {
  const cells = board.map((value, idx) => {
    if (value === 'X') return '❌';
    if (value === 'O') return '⭕';
    return `${idx + 1}️⃣`;
  });

  return `${cells.slice(0, 3).join(' | ')}\n${cells.slice(3, 6).join(' | ')}\n${cells.slice(6, 9).join(' | ')}`;
}

function checkTttWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function isBoardFull(board) {
  return board.every(Boolean);
}

function chooseBotMove(board) {
  const empty = board
    .map((value, idx) => ({ value, idx }))
    .filter((cell) => !cell.value)
    .map((cell) => cell.idx);

  return empty[Math.floor(Math.random() * empty.length)];
}

function createTttResultEmbed(board, winner, color) {
  const description = winner === 'X' ? 'Kamu menang 🎉' : winner === 'O' ? 'Bot menang 🤖' : 'Seri 🤝';
  return createStatusEmbed({
    color,
    title: '🏁 Tic Tac Toe Selesai',
    description: `${renderBoard(board)}\n\n${description}`
  });
}
