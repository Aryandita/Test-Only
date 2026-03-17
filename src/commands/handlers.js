import { MessageFlags } from 'discord.js';
import {
  createAiAnswerEmbed,
  createGameResultPanel,
  createMusicControlComponents,
  createNowPlayingEmbed,
  createRpsPanel,
  createStatusEmbed,
  createTttPanel,
  formatQueue
} from '../utils/music-ui.js';

const tttGames = new Map();
const aiThreads = new Map();
const aiReplyOwners = new Map();
const RPS_CHOICES = ['rock', 'paper', 'scissors'];
const RPS_EMOJI = { rock: '✊', paper: '✋', scissors: '✌️' };

function isOwner(userId, ownerId) {
  return userId === ownerId;
}

function startTypingLoop(channel) {
  if (!channel?.sendTyping) return () => {};
  channel.sendTyping().catch(() => null);
  const interval = setInterval(() => channel.sendTyping().catch(() => null), 7000);
  return () => clearInterval(interval);
}

function rememberAiReply(message, userId) {
  if (!message?.id) return;
  aiReplyOwners.set(message.id, userId);
  if (aiReplyOwners.size > 500) {
    const firstKey = aiReplyOwners.keys().next().value;
    aiReplyOwners.delete(firstKey);
  }
}

export async function handleCommand(interaction, context) {
  await runCommand({
    command: interaction.commandName,
    args: {
      query: interaction.options.getString('query'),
      prompt: interaction.options.getString('prompt'),
      rpsChoice: interaction.options.getString('pilihan')
    },
    context,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    userId: interaction.user.id,
    member: interaction.member,
    shardId: interaction.guild?.shardId,
    reply: (payload) => interaction.reply(payload),
    deferReply: (payload) => interaction.deferReply(payload),
    editReply: (payload) => interaction.editReply(payload),
    sourceChannel: interaction.channel
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
      rpsChoice: rest[0]?.toLowerCase()
    },
    context,
    guildId: message.guildId,
    channelId: message.channelId,
    userId: message.author.id,
    member: message.member,
    shardId: message.guild?.shardId,
    reply: (body) => message.reply(normalizePrefixPayload(body)),
    deferReply: async () => {},
    editReply: (body) => message.reply(normalizePrefixPayload(body)),
    sourceChannel: message.channel
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

  const ownerId = aiReplyOwners.get(message.reference.messageId);
  if (!ownerId || ownerId !== message.author.id) return;

  const threadKey = `${message.channelId}:${message.author.id}`;
  const existing = aiThreads.get(threadKey) ?? [];
  const prompt = message.content.trim();
  if (!prompt) return;

  const stopTyping = startTypingLoop(message.channel);
  try {
    const answer = await context.aiService.ask({ userId: message.author.id, prompt, history: existing });
    aiThreads.set(threadKey, [...existing, { role: 'user', text: prompt }, { role: 'assistant', text: answer }].slice(-8));

    const sent = await message.reply({ embeds: [createAiAnswerEmbed({ color: context.env.embedHex, answer })] });
    rememberAiReply(sent, message.author.id);
  } finally {
    stopTyping();
  }
}

export async function handleGameButton(interaction, context) {
  const { env } = context;

  if (interaction.customId.startsWith('game:rps:')) {
    const [, , ownerId, choice] = interaction.customId.split(':');
    if (interaction.user.id !== ownerId) {
      await interaction.reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '⛔ Bukan Giliran Kamu', description: 'Tombol ini milik user lain.' })], ephemeral: true });
      return;
    }

    const botChoice = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
    const result = resolveRpsResult(choice, botChoice);
    await interaction.update(
      createGameResultPanel({
        title: '🕹️ Hasil Rock Paper Scissors',
        description: `Kamu: ${RPS_EMOJI[choice]} **${choice}**\nBot: ${RPS_EMOJI[botChoice]} **${botChoice}**\n\nHasil: **${result}**`
      })
    );
    return;
  }

  if (interaction.customId.startsWith('game:ttt:')) {
    const [, , ownerId, idxRaw] = interaction.customId.split(':');
    const idx = Number(idxRaw);

    if (interaction.user.id !== ownerId) {
      await interaction.reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '⛔ Bukan Giliran Kamu', description: 'Tombol ini milik user lain.' })], ephemeral: true });
      return;
    }

    const gameKey = `${interaction.channelId}:${ownerId}`;
    const game = tttGames.get(gameKey);
    if (!game) {
      await interaction.reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❎ Game Berakhir', description: 'Silakan mulai game baru dengan /tictactoe.' })], ephemeral: true });
      return;
    }

    if (game.board[idx]) {
      await interaction.reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '⚠️ Kotak Terisi', description: 'Pilih kotak lain.' })], ephemeral: true });
      return;
    }

    game.board[idx] = 'X';
    let winner = checkTttWinner(game.board);
    if (winner || isBoardFull(game.board)) {
      tttGames.delete(gameKey);
      await interaction.update(
        createGameResultPanel({
          title: '🏁 Tic Tac Toe Selesai',
          description: createTttResultText(game.board, winner)
        })
      );
      return;
    }

    const botMove = chooseBotMove(game.board);
    game.board[botMove] = 'O';
    winner = checkTttWinner(game.board);
    if (winner || isBoardFull(game.board)) {
      tttGames.delete(gameKey);
      await interaction.update(
        createGameResultPanel({
          title: '🏁 Tic Tac Toe Selesai',
          description: createTttResultText(game.board, winner)
        })
      );
      return;
    }

    await interaction.update({ ...createTttPanel({ userId: ownerId, board: game.board, statusText: 'Giliran kamu (X).' }) });
  }
}

function normalizePrefixPayload(body) {
  if (typeof body === 'string') return { content: body };
  const { ephemeral, flags, ...rest } = body;
  return rest;
}

async function runCommand(input) {
  const { command, args, context, guildId, channelId, userId, member, shardId, reply, deferReply, editReply, sourceChannel } = input;
  const { musicManager, aiService, env, registerCommands, client } = context;

  switch (command) {
    case 'play': {
      const query = args.query?.trim();
      const voiceChannel = member?.voice?.channel;
      if (!query) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '🎧 Query Kosong', description: `Contoh: \`${env.prefix}play let her go\` atau \`/play\`` })], ephemeral: true });
        return;
      }
      if (!voiceChannel) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '🚫 Voice Channel Tidak Ditemukan', description: 'Masuk voice channel dulu sebelum memutar lagu.' })], ephemeral: true });
        return;
      }

      await deferReply();
      const track = await musicManager.search(query);
      if (!track) {
        await editReply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '🔎 Lagu Tidak Ditemukan', description: 'Coba kata kunci lain atau URL yang valid.' })] });
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
      await editReply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '⏭️ Skip Berhasil', description: track ? `Lanjut memutar **${track.info.title}**.` : 'Antrian habis.' })] });
      return;
    }

    case 'stop': {
      await musicManager.stop(guildId);
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '⏹️ Playback Dihentikan', description: 'Musik dihentikan dan bot keluar dari voice channel.' })] });
      return;
    }

    case 'queue': {
      const queue = musicManager.getQueue(guildId);
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '📜 Daftar Antrian', description: formatQueue(queue) })] });
      return;
    }

    case 'loop': {
      const enabled = musicManager.toggleLoop(guildId);
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '🔁 Status Loop', description: enabled ? 'Loop diaktifkan.' : 'Loop dimatikan.' })] });
      return;
    }

    case 'autoplay': {
      const enabled = musicManager.toggleAutoplay(guildId);
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '♾️ Status Autoplay', description: enabled ? 'Autoplay diaktifkan.' : 'Autoplay dimatikan.' })] });
      return;
    }

    case 'ai': {
      const prompt = args.prompt?.trim();
      if (!prompt) {
        await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '💬 Prompt Kosong', description: `Contoh: \`${env.prefix}ai jelaskan setup lavalink\`` })], ephemeral: true });
        return;
      }

      await deferReply();
      const stopTyping = startTypingLoop(sourceChannel);
      try {
        const threadKey = `${channelId}:${userId}`;
        const history = aiThreads.get(threadKey) ?? [];
        const answer = await aiService.ask({ userId, prompt, history });
        aiThreads.set(threadKey, [...history, { role: 'user', text: prompt }, { role: 'assistant', text: answer }].slice(-8));
        const sent = await editReply({ embeds: [createAiAnswerEmbed({ color: env.embedHex, answer })] });
        rememberAiReply(sent, userId);
      } finally {
        stopTyping();
      }
      return;
    }

    case 'rps': {
      await reply(createRpsPanel(userId));
      return;
    }

    case 'tictactoe': {
      const board = Array(9).fill(null);
      tttGames.set(`${channelId}:${userId}`, { board, userId });
      await reply(createTttPanel({ userId, board, statusText: 'Giliran kamu dulu (X).' }));
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
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '📚 Bantuan Command', description: `${env.prefix}play <query>\n${env.prefix}skip\n${env.prefix}stop\n${env.prefix}queue\n${env.prefix}loop\n${env.prefix}autoplay\n${env.prefix}ai <prompt>\n${env.prefix}rps\n${env.prefix}tictactoe\n${env.prefix}help` })] });
      return;
    }

    default:
      await reply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❓ Command Tidak Dikenal', description: `Command \`${command}\` tidak tersedia. Coba \`${env.prefix}help\`.` })] });
  }
}

function resolveRpsResult(player, bot) {
  if (player === bot) return 'Seri 🤝';
  if ((player === 'rock' && bot === 'scissors') || (player === 'paper' && bot === 'rock') || (player === 'scissors' && bot === 'paper')) {
    return 'Kamu menang 🎉';
  }
  return 'Bot menang 🤖';
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

function createTttResultText(board, winner) {
  const toEmoji = (val, idx) => {
    if (val === 'X') return '❌';
    if (val === 'O') return '⭕';
    return `${idx + 1}️⃣`;
  };

  const rows = [0, 1, 2]
    .map((r) => board.slice(r * 3, r * 3 + 3).map((v, i) => toEmoji(v, r * 3 + i)).join(' | '))
    .join('\n');

  const description = winner === 'X' ? 'Kamu menang 🎉' : winner === 'O' ? 'Bot menang 🤖' : 'Seri 🤝';
  return `${rows}\n\n${description}`;
}
