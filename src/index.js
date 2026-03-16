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
const ownerIds = new Set(
  (process.env.OWNER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
);

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
  nodes: [
    {
      host: process.env.LAVALINK_HOST || '127.0.0.1',
      port: Number(process.env.LAVALINK_PORT || 2333),
      password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
      secure: process.env.LAVALINK_SECURE === 'true',
    },
  ],
  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
});

const OWNER_PERSONA = [
  'Kamu adalah asisten AI khusus untuk OWNER bot Discord.',
  'Gaya bahasa: ringkas, teknis, to-the-point, boleh memberi saran konfigurasi production-grade.',
  'Fokus: debugging, arsitektur bot/music, keamanan token, performa Lavalink.',
].join(' ');

const MEMBER_PERSONA = [
  'Kamu adalah asisten AI ramah untuk member server Discord.',
  'Gaya bahasa: santai, jelas, tidak terlalu teknis, berikan langkah sederhana.',
  'Fokus: membantu penggunaan command bot, rekomendasi lagu, dan troubleshooting ringan.',
].join(' ');

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
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
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

  return text;
};

const ensurePlayer = async (message) => {
  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) {
    await message.reply('Masuk voice channel dulu sebelum pakai command music.');
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

  return player.queue
    .slice(0, 10)
    .map((track, index) => `${index + 1}. ${track.title} [${track.duration}]`)
    .join('\n');
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
      new ButtonBuilder()
        .setCustomId('music_toggle_pause')
        .setLabel(isPaused ? 'Play' : 'Pause')
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji(isPaused ? '▶️' : '⏸️'),
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

  const thumbnail = getTrackThumbnail(track);
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🎶 Now Playing')
    .setDescription(`**${track.title}**\nDuration: \`${track.duration}\`\nVolume: **${player.volume}%**`)
    .setURL(track.uri || null)
    .setFooter({ text: `Requester: ${track.requester?.tag || 'Unknown'}` });

  if (thumbnail) embed.setThumbnail(thumbnail);

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
  .on('queueEnd', (player) => {
    const textChannel = client.channels.cache.get(player.textChannel);
    const is247 = stay247Guilds.has(player.guild);

    if (textChannel) {
      textChannel.send(is247 ? '🔁 Queue habis. Mode 24/7 aktif, bot tetap stay di voice channel.' : '✅ Queue selesai, bot keluar voice channel.');
    }

    if (!is247) player.destroy();
  });

client.once('ready', () => {
  console.log(`✅ Bot online sebagai ${client.user.tag}`);
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
    return interaction.reply({ content: 'Tidak ada player aktif.', ephemeral: true });
  }

  try {
    if (interaction.customId === 'music_toggle_pause') {
      player.pause(!player.paused);
      return interaction.update({
        content: player.paused ? '⏸️ Musik di-pause.' : '▶️ Musik dilanjutkan.',
        components: buildPlayerControls(player),
      });
    }

    if (interaction.customId === 'music_stop') {
      player.queue.clear();
      player.stop();
      stay247Guilds.delete(interaction.guildId);
      player.destroy();
      return interaction.update({
        content: '⏹️ Musik dihentikan dan bot keluar dari voice channel.',
        components: [],
      });
    }

    if (interaction.customId === 'music_loop') {
      const enabled = !player.trackRepeat;
      player.setTrackRepeat(enabled);
      return interaction.reply({
        content: enabled ? '🔁 Loop lagu aktif.' : '➡️ Loop lagu nonaktif.',
        ephemeral: true,
      });
    }

    if (interaction.customId === 'music_queue') {
      const embed = new EmbedBuilder().setTitle('🎶 Music Queue').setDescription(queuePreview(player)).setColor(0x00ae86);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.customId === 'music_volume') {
      const nextVolume = player.volume >= 150 ? 30 : Math.min(player.volume + 10, 150);
      player.setVolume(nextVolume);
      return interaction.reply({
        content: `🔊 Volume di-set ke **${nextVolume}%**.`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
    return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  const [command, ...args] = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmd = command?.toLowerCase();

  try {
    if (cmd === 'ai') {
      const prompt = args.join(' ').trim();
      if (!prompt) {
        return message.reply(`Gunakan: ${prefix}ai <pertanyaan>`);
      }

      const isOwner = ownerIds.has(message.author.id);
      await message.channel.sendTyping();
      const result = await generateGeminiResponse({ prompt, isOwner });
      const roleText = isOwner ? 'OWNER Persona' : 'MEMBER Persona';

      return message.reply(`🤖 **AI (${roleText})**\n${result.slice(0, 1800)}`);
    }

    if (cmd === 'play' || cmd === 'p') {
      const query = args.join(' ');
      if (!query) {
        return message.reply(`Gunakan: ${prefix}play <judul lagu / url>`);
      }

      const player = await ensurePlayer(message);
      if (!player) return;

      const sourcePrefix = query.startsWith('http') ? '' : `${defaultSearchSource}:`;
      const res = await manager.search(`${sourcePrefix}${query}`, message.author);

      if (res.loadType === 'LOAD_FAILED' || res.loadType === 'NO_MATCHES') {
        if (!player.playing && !player.queue.size) player.destroy();
        return message.reply('Lagu tidak ditemukan dari source Lavalink yang aktif.');
      }

      if (res.loadType === 'PLAYLIST_LOADED') {
        player.queue.add(res.tracks);
        if (!player.playing && !player.paused) player.play();
        return message.reply(`📚 Playlist dimasukkan: **${res.playlist.name}** (${res.tracks.length} lagu).`);
      }

      const track = res.tracks[0];
      player.queue.add(track);
      if (!player.playing && !player.paused) player.play();
      return message.reply(`➕ Added: **${track.title}**`);
    }

    if (cmd === 'skip') {
      const player = manager.players.get(message.guild.id);
      if (!player) return message.reply('Tidak ada player aktif.');
      player.stop();
      return message.reply('⏭️ Lagu di-skip.');
    }

    if (cmd === 'stop') {
      const player = manager.players.get(message.guild.id);
      if (!player) return message.reply('Tidak ada player aktif.');
      player.queue.clear();
      player.stop();
      return message.reply('⏹️ Musik dihentikan dan queue dibersihkan.');
    }

    if (cmd === 'pause') {
      const player = manager.players.get(message.guild.id);
      if (!player) return message.reply('Tidak ada player aktif.');
      player.pause(true);
      return message.reply('⏸️ Musik di-pause.');
    }

    if (cmd === 'resume') {
      const player = manager.players.get(message.guild.id);
      if (!player) return message.reply('Tidak ada player aktif.');
      player.pause(false);
      return message.reply('▶️ Musik dilanjutkan.');
    }

    if (cmd === 'volume' || cmd === 'vol') {
      const player = manager.players.get(message.guild.id);
      if (!player) return message.reply('Tidak ada player aktif.');

      const input = Number(args[0]);
      if (!input || Number.isNaN(input) || input < 1 || input > 150) {
        return message.reply(`Gunakan: ${prefix}volume <1-150>`);
      }

      player.setVolume(input);
      return message.reply(`🔊 Volume di-set ke **${input}%**.`);
    }

    if (cmd === 'queue' || cmd === 'q') {
      const player = manager.players.get(message.guild.id);
      const embed = new EmbedBuilder()
        .setTitle('🎶 Music Queue')
        .setDescription(queuePreview(player))
        .setColor(0x00ae86);

      return message.reply({ embeds: [embed] });
    }

    if (cmd === 'np' || cmd === 'nowplaying') {
      const player = manager.players.get(message.guild.id);
      if (!player?.queue?.current) return message.reply('Tidak ada lagu yang sedang diputar.');

      const track = player.queue.current;
      const thumbnail = getTrackThumbnail(track);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🎧 Now Playing')
        .setDescription(`**${track.title}**\nDuration: \`${track.duration}\`\nVolume: **${player.volume}%**`)
        .setURL(track.uri || null);

      if (thumbnail) embed.setThumbnail(thumbnail);

      return message.reply({ embeds: [embed], components: buildPlayerControls(player) });
    }

    if (cmd === '247') {
      const player = manager.players.get(message.guild.id);
      if (!player) {
        return message.reply('Belum ada player aktif. Jalankan play dulu lalu toggle 24/7.');
      }

      const isEnabled = stay247Guilds.has(message.guild.id);
      if (isEnabled) {
        stay247Guilds.delete(message.guild.id);
        return message.reply('🛌 Mode 24/7 **OFF**. Bot akan keluar setelah queue habis.');
      }

      stay247Guilds.add(message.guild.id);
      return message.reply('🟢 Mode 24/7 **ON**. Bot tetap stay di voice channel saat queue habis.');
    }

    if (cmd === 'leave' || cmd === 'disconnect') {
      const player = manager.players.get(message.guild.id);
      if (!player) return message.reply('Bot tidak sedang berada di voice channel.');

      stay247Guilds.delete(message.guild.id);
      player.destroy();
      return message.reply('👋 Bot keluar dari voice channel.');
    }

    if (cmd === 'ping') {
      return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
    }

    if (cmd === 'help') {
      const embed = new EmbedBuilder()
        .setTitle('📘 Basic Music + AI Commands (Lavalink + Buttons)')
        .setColor(0x5865f2)
        .setDescription([
          `\`${prefix}play <judul/url>\` - Play lagu dari source Lavalink`,
          `\`${prefix}skip\` - Skip lagu sekarang`,
          `\`${prefix}stop\` - Stop dan clear queue`,
          `\`${prefix}pause\` - Pause lagu`,
          `\`${prefix}resume\` - Lanjutkan lagu`,
          `\`${prefix}volume <1-150>\` - Atur volume`,
          `\`${prefix}queue\` - Lihat queue`,
          `\`${prefix}nowplaying\` - Lihat lagu aktif + thumbnail + tombol`,
          `\`${prefix}247\` - Toggle mode 24/7`,
          `\`${prefix}leave\` - Bot keluar VC`,
          `\`${prefix}ai <pertanyaan>\` - Chat AI (Gemini 2.5 Flash, persona owner/member)`,
          `\`${prefix}ping\` - Cek latency bot`,
        ].join('\n'));

      return message.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error(error);
    return message.reply(`❌ Error: ${error.message || 'Terjadi kesalahan saat menjalankan command.'}`);
  }
});

client.login(token);
