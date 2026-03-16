require('dotenv').config();

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Partials,
} = require('discord.js');
const { Manager } = require('erela.js');

const token = process.env.DISCORD_TOKEN;
const prefix = process.env.PREFIX || '!';
const stay247Default = process.env.STAY_24_7 === 'true';
const defaultSearchSource = process.env.DEFAULT_SEARCH_SOURCE || 'ytsearch';
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const parseList = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const lavalinkHosts = parseList(process.env.LAVALINK_HOSTS || process.env.LAVALINK_HOST || 'hyperion.kythia.xyz');
const lavalinkPorts = parseList(process.env.LAVALINK_PORTS || process.env.LAVALINK_PORT || '3010');
const lavalinkPasswords = parseList(process.env.LAVALINK_PASSWORDS || process.env.LAVALINK_PASSWORD || 'dsc.gg/kythia');
const lavalinkSecures = parseList(process.env.LAVALINK_SECURES || process.env.LAVALINK_SECURE || 'false');
const ownerIds = new Set(parseList(process.env.OWNER_IDS));

const parseHexColor = (hex) => {
  if (!hex) return null;
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) return null;
  return Number.parseInt(normalized, 16);
};

const defaultEmbedColor = parseHexColor(process.env.EMBED_COLOR || '#5865F2') || 0x5865f2;
const guildEmbedColors = new Map();

const lavalinkNodes = lavalinkHosts.map((host, index) => ({
  identifier: `node-${index + 1}`,
  host,
  port: Number(lavalinkPorts[index] || lavalinkPorts[0] || 3010),
  password: lavalinkPasswords[index] || lavalinkPasswords[0] || 'dsc.gg/kythia',
  secure: (lavalinkSecures[index] || lavalinkSecures[0] || 'false') === 'true',
}));

if (!token) {
  throw new Error('DISCORD_TOKEN belum di-set. Isi file .env terlebih dahulu.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const stay247Guilds = new Set();

const manager = new Manager({
  nodes: lavalinkNodes,
  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
});

const OWNER_PERSONA = [
  'Kamu adalah asisten AI khusus untuk OWNER bot Discord.',
  'Jawaban harus langsung ke inti, tanpa pembukaan panjang, tanpa menyebut persona, tanpa menjelaskan alur berpikir internal.',
  'Fokus: debugging, arsitektur bot/music, keamanan token, performa Lavalink.',
].join(' ');

const MEMBER_PERSONA = [
  'Kamu adalah asisten AI untuk member server Discord.',
  'Jawaban harus langsung ke inti, praktis, tanpa menyebut persona, tanpa menjelaskan alur berpikir internal.',
  'Fokus: penggunaan command bot, rekomendasi lagu, dan troubleshooting ringan.',
].join(' ');

const getEmbedColor = (guildId) => guildEmbedColors.get(guildId) || defaultEmbedColor;

const buildEmbed = ({ guildId, title, description, color, thumbnail, url, footer }) => {
  const embed = new EmbedBuilder()
    .setColor(color || getEmbedColor(guildId))
    .setTitle(title)
    .setDescription(description);

  if (thumbnail) embed.setThumbnail(thumbnail);
  if (url) embed.setURL(url);
  if (footer) embed.setFooter({ text: footer });
  return embed;
};

const sendCommandEmbed = async (ctx, payload) => {
  const guildId = ctx.guildId || ctx.guild?.id;
  const embed = buildEmbed({ guildId, ...payload });

  if ('isRepliable' in ctx && typeof ctx.isRepliable === 'function') {
    return ctx.reply({ embeds: [embed], ephemeral: Boolean(payload.ephemeral) });
  }
  return ctx.reply({ embeds: [embed] });
};

const generateGeminiResponse = async ({ prompt, isOwner }) => {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY belum di-set.');
  }

  const systemInstruction = isOwner ? OWNER_PERSONA : MEMBER_PERSONA;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join('\n');
  if (!text) throw new Error('Gemini tidak mengembalikan jawaban teks.');

  return text.trim();
};

const ensurePlayer = async (message) => {
  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) {
    await sendCommandEmbed(message, {
      title: '⚠️ Voice Channel Diperlukan',
      description: 'Masuk voice channel dulu sebelum pakai command music.',
    });
    return null;
  }

  const player = manager.create({
    guild: message.guild.id,
    voiceChannel: voiceChannel.id,
    textChannel: message.channel.id,
    selfDeafen: true,
    volume: 80,
  });

  if (!player.connected) player.connect();
  return player;
};

const queuePreview = (player) => {
  if (!player?.queue?.size) return 'Queue kosong.';
  return player.queue.slice(0, 10).map((track, index) => `${index + 1}. ${track.title} [${track.duration}]`).join('\n');
};

const getTrackThumbnail = (track) => {
  if (!track) return null;
  if (track.thumbnail) return track.thumbnail;

  const youtubeRegex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([\w-]{11})/;
  const match = track.uri ? track.uri.match(youtubeRegex) : null;
  if (match?.[1]) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;

  return null;
};

const buildPlayerControls = (player) => {
  const isPaused = Boolean(player?.paused);
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music_toggle_pause').setLabel(isPaused ? 'Play' : 'Pause').setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary).setEmoji(isPaused ? '▶️' : '⏸️'),
      new ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setStyle(ButtonStyle.Danger).setEmoji('⏹️'),
      new ButtonBuilder().setCustomId('music_loop').setLabel('Loop').setStyle(ButtonStyle.Primary).setEmoji('🔁'),
      new ButtonBuilder().setCustomId('music_queue').setLabel('Queue').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
      new ButtonBuilder().setCustomId('music_volume').setLabel('Volume +10').setStyle(ButtonStyle.Secondary).setEmoji('🔊'),
    ),
  ];
};

const sendNowPlayingMessage = async (player, track) => {
  const textChannel = client.channels.cache.get(player.textChannel);
  if (!textChannel) return;

  const embed = buildEmbed({
    guildId: player.guild,
    title: '🎶 Now Playing',
    description: `**${track.title}**\nDuration: \`${track.duration}\`\nVolume: **${player.volume}%**`,
    thumbnail: getTrackThumbnail(track),
    url: track.uri || null,
    footer: `Requester: ${track.requester?.tag || 'Unknown'}`,
  });

  await textChannel.send({ embeds: [embed], components: buildPlayerControls(player) });
};

manager
  .on('nodeConnect', (node) => {
    console.log(`✅ Lavalink node terhubung: ${node.options.identifier || node.options.host}`);
  })
  .on('nodeError', (node, error) => {
    console.error(`❌ Lavalink node error (${node.options.identifier || node.options.host}):`, error.message);
  })
  .on('trackStart', async (player, track) => {
    await sendNowPlayingMessage(player, track);
  })
  .on('queueEnd', async (player) => {
    const textChannel = client.channels.cache.get(player.textChannel);
    const is247 = stay247Guilds.has(player.guild);

    if (textChannel) {
      const embed = buildEmbed({
        guildId: player.guild,
        title: is247 ? '🔁 Queue Habis (24/7 ON)' : '✅ Queue Selesai',
        description: is247 ? 'Mode 24/7 aktif, bot tetap stay di voice channel.' : 'Bot keluar dari voice channel.',
      });
      await textChannel.send({ embeds: [embed] });
    }

    if (!is247) player.destroy();
  });

client.once('ready', () => {
  console.log(`✅ Bot online sebagai ${client.user.tag}`);
  console.log(`ℹ️ Lavalink nodes configured: ${lavalinkNodes.map((n) => `${n.host}:${n.port}`).join(', ')}`);
  manager.init(client.user.id);

  if (stay247Default) {
    console.log('ℹ️ STAY_24_7 default aktif dari environment.');
  }
});

client.on('raw', (data) => manager.updateVoiceState(data));

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.guildId) return;

  const player = manager.players.get(interaction.guildId);
  if (!player) {
    return sendCommandEmbed(interaction, {
      title: '⚠️ Player Tidak Aktif',
      description: 'Tidak ada player aktif.',
      ephemeral: true,
    });
  }

  try {
    if (interaction.customId === 'music_toggle_pause') {
      player.pause(!player.paused);
      const embed = buildEmbed({
        guildId: interaction.guildId,
        title: player.paused ? '⏸️ Musik Di-pause' : '▶️ Musik Dilanjutkan',
        description: `Status terbaru player telah diperbarui.`,
      });
      return interaction.update({ embeds: [embed], components: buildPlayerControls(player) });
    }

    if (interaction.customId === 'music_stop') {
      player.queue.clear();
      player.stop();
      stay247Guilds.delete(interaction.guildId);
      player.destroy();
      const embed = buildEmbed({
        guildId: interaction.guildId,
        title: '⏹️ Musik Dihentikan',
        description: 'Queue dibersihkan dan bot keluar dari voice channel.',
      });
      return interaction.update({ embeds: [embed], components: [] });
    }

    if (interaction.customId === 'music_loop') {
      const enabled = !player.trackRepeat;
      player.setTrackRepeat(enabled);
      return sendCommandEmbed(interaction, {
        title: '🔁 Loop Track',
        description: enabled ? 'Loop lagu aktif.' : 'Loop lagu nonaktif.',
        ephemeral: true,
      });
    }

    if (interaction.customId === 'music_queue') {
      return sendCommandEmbed(interaction, {
        title: '🎶 Music Queue',
        description: queuePreview(player),
        ephemeral: true,
      });
    }

    if (interaction.customId === 'music_volume') {
      const nextVolume = player.volume >= 150 ? 30 : Math.min(player.volume + 10, 150);
      player.setVolume(nextVolume);
      return sendCommandEmbed(interaction, {
        title: '🔊 Volume Diubah',
        description: `Volume saat ini: **${nextVolume}%**`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({ embeds: [buildEmbed({ guildId: interaction.guildId, title: '❌ Error', description: error.message })], ephemeral: true });
    }
    return sendCommandEmbed(interaction, { title: '❌ Error', description: error.message, ephemeral: true });
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  const [command, ...args] = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmd = command?.toLowerCase();

  try {
    if (cmd === 'color') {
      const hex = args[0];
      const parsed = parseHexColor(hex);
      if (!parsed) {
        return sendCommandEmbed(message, {
          title: '🎨 Format Warna Salah',
          description: `Gunakan: ${prefix}color <hex>. Contoh: ${prefix}color #FF8800`,
        });
      }
      guildEmbedColors.set(message.guild.id, parsed);
      return sendCommandEmbed(message, {
        title: '🎨 Warna Embed Diubah',
        description: `Warna embed command di server ini diset ke **${hex.toUpperCase()}**.`,
        color: parsed,
      });
    }

    if (cmd === 'ai') {
      const prompt = args.join(' ').trim();
      if (!prompt) {
        return sendCommandEmbed(message, {
          title: '🤖 AI Command',
          description: `Gunakan: ${prefix}ai <pertanyaan>`,
        });
      }

      const isOwner = ownerIds.has(message.author.id);
      await message.channel.sendTyping();
      const result = await generateGeminiResponse({ prompt, isOwner });
      return sendCommandEmbed(message, {
        title: '🤖 AI Response',
        description: result.slice(0, 3900),
      });
    }

    if (cmd === 'play' || cmd === 'p') {
      const query = args.join(' ');
      if (!query) {
        return sendCommandEmbed(message, {
          title: '🎵 Play Command',
          description: `Gunakan: ${prefix}play <judul lagu / url>`,
        });
      }

      const player = await ensurePlayer(message);
      if (!player) return;

      const sourcePrefix = query.startsWith('http') ? '' : `${defaultSearchSource}:`;
      const res = await manager.search(`${sourcePrefix}${query}`, message.author);

      if (res.loadType === 'LOAD_FAILED' || res.loadType === 'NO_MATCHES') {
        if (!player.playing && !player.queue.size) player.destroy();
        return sendCommandEmbed(message, {
          title: '❌ Lagu Tidak Ditemukan',
          description: 'Lagu tidak ditemukan dari source Lavalink yang aktif.',
        });
      }

      if (res.loadType === 'PLAYLIST_LOADED') {
        player.queue.add(res.tracks);
        if (!player.playing && !player.paused) player.play();
        return sendCommandEmbed(message, {
          title: '📚 Playlist Ditambahkan',
          description: `**${res.playlist.name}** (${res.tracks.length} lagu) masuk ke queue.`,
        });
      }

      const track = res.tracks[0];
      player.queue.add(track);
      if (!player.playing && !player.paused) player.play();
      return sendCommandEmbed(message, {
        title: '➕ Lagu Ditambahkan',
        description: `**${track.title}**`,
      });
    }

    if (cmd === 'skip') {
      const player = manager.players.get(message.guild.id);
      if (!player) return sendCommandEmbed(message, { title: '⚠️ Player Tidak Aktif', description: 'Tidak ada player aktif.' });
      player.stop();
      return sendCommandEmbed(message, { title: '⏭️ Skip', description: 'Lagu di-skip.' });
    }

    if (cmd === 'stop') {
      const player = manager.players.get(message.guild.id);
      if (!player) return sendCommandEmbed(message, { title: '⚠️ Player Tidak Aktif', description: 'Tidak ada player aktif.' });
      player.queue.clear();
      player.stop();
      return sendCommandEmbed(message, { title: '⏹️ Stop', description: 'Musik dihentikan dan queue dibersihkan.' });
    }

    if (cmd === 'pause') {
      const player = manager.players.get(message.guild.id);
      if (!player) return sendCommandEmbed(message, { title: '⚠️ Player Tidak Aktif', description: 'Tidak ada player aktif.' });
      player.pause(true);
      return sendCommandEmbed(message, { title: '⏸️ Pause', description: 'Musik di-pause.' });
    }

    if (cmd === 'resume') {
      const player = manager.players.get(message.guild.id);
      if (!player) return sendCommandEmbed(message, { title: '⚠️ Player Tidak Aktif', description: 'Tidak ada player aktif.' });
      player.pause(false);
      return sendCommandEmbed(message, { title: '▶️ Resume', description: 'Musik dilanjutkan.' });
    }

    if (cmd === 'volume' || cmd === 'vol') {
      const player = manager.players.get(message.guild.id);
      if (!player) return sendCommandEmbed(message, { title: '⚠️ Player Tidak Aktif', description: 'Tidak ada player aktif.' });

      const input = Number(args[0]);
      if (!input || Number.isNaN(input) || input < 1 || input > 150) {
        return sendCommandEmbed(message, { title: '🔊 Volume', description: `Gunakan: ${prefix}volume <1-150>` });
      }

      player.setVolume(input);
      return sendCommandEmbed(message, { title: '🔊 Volume Diubah', description: `Volume di-set ke **${input}%**.` });
    }

    if (cmd === 'queue' || cmd === 'q') {
      const player = manager.players.get(message.guild.id);
      return sendCommandEmbed(message, { title: '🎶 Music Queue', description: queuePreview(player) });
    }

    if (cmd === 'np' || cmd === 'nowplaying') {
      const player = manager.players.get(message.guild.id);
      if (!player?.queue?.current) return sendCommandEmbed(message, { title: '🎧 Now Playing', description: 'Tidak ada lagu yang sedang diputar.' });

      const track = player.queue.current;
      const embed = buildEmbed({
        guildId: message.guild.id,
        title: '🎧 Now Playing',
        description: `**${track.title}**\nDuration: \`${track.duration}\`\nVolume: **${player.volume}%**`,
        thumbnail: getTrackThumbnail(track),
        url: track.uri || null,
      });
      return message.reply({ embeds: [embed], components: buildPlayerControls(player) });
    }

    if (cmd === '247') {
      const player = manager.players.get(message.guild.id);
      if (!player) {
        return sendCommandEmbed(message, { title: '🕒 24/7', description: 'Belum ada player aktif. Jalankan play dulu lalu toggle 24/7.' });
      }

      const isEnabled = stay247Guilds.has(message.guild.id);
      if (isEnabled) {
        stay247Guilds.delete(message.guild.id);
        return sendCommandEmbed(message, { title: '🛌 24/7 OFF', description: 'Bot akan keluar setelah queue habis.' });
      }

      stay247Guilds.add(message.guild.id);
      return sendCommandEmbed(message, { title: '🟢 24/7 ON', description: 'Bot tetap stay di voice channel saat queue habis.' });
    }

    if (cmd === 'leave' || cmd === 'disconnect') {
      const player = manager.players.get(message.guild.id);
      if (!player) return sendCommandEmbed(message, { title: '👋 Leave', description: 'Bot tidak sedang berada di voice channel.' });

      stay247Guilds.delete(message.guild.id);
      player.destroy();
      return sendCommandEmbed(message, { title: '👋 Leave', description: 'Bot keluar dari voice channel.' });
    }

    if (cmd === 'ping') {
      return sendCommandEmbed(message, { title: '🏓 Pong', description: `${client.ws.ping}ms` });
    }

    if (cmd === 'help') {
      return sendCommandEmbed(message, {
        title: '📘 Commands',
        description: [
          `\`${prefix}play <judul/url>\``,
          `\`${prefix}skip\``,
          `\`${prefix}stop\``,
          `\`${prefix}pause\``,
          `\`${prefix}resume\``,
          `\`${prefix}volume <1-150>\``,
          `\`${prefix}queue\``,
          `\`${prefix}nowplaying\``,
          `\`${prefix}247\``,
          `\`${prefix}leave\``,
          `\`${prefix}ai <pertanyaan>\``,
          `\`${prefix}color <hex>\``,
          `\`${prefix}ping\``,
        ].join('\n'),
      });
    }
  } catch (error) {
    console.error(error);
    return sendCommandEmbed(message, { title: '❌ Error', description: error.message || 'Terjadi kesalahan saat menjalankan command.' });
  }
});

client.login(token);
