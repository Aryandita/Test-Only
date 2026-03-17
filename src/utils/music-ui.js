import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  EmbedBuilder,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} from 'discord.js';

export function createMusicControlComponents(autoplayEnabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music:skip').setLabel('⏭️ Skip').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('music:loop').setLabel('🔁 Loop').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music:autoplay')
        .setLabel(autoplayEnabled ? '♾️ Autoplay ON' : '♾️ Autoplay OFF')
        .setStyle(autoplayEnabled ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music:stop').setLabel('⏹️ Stop').setStyle(ButtonStyle.Danger)
    )
  ];
}

export function createNowPlayingEmbed({ track, loopEnabled, autoplayEnabled, color, queued = false, position = null }) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(queued ? '✅ Lagu Ditambahkan ke Antrian' : '🎵 Sekarang Memutar')
    .setDescription(`**${track.info.title}**\nby ${track.info.author}`)
    .addFields(
      { name: '⏱️ Durasi', value: formatMs(track.info.length), inline: true },
      { name: '🔁 Loop', value: loopEnabled ? 'Aktif' : 'Mati', inline: true },
      { name: '♾️ Autoplay', value: autoplayEnabled ? 'Aktif' : 'Mati', inline: true },
      { name: '📍 Posisi Antrian', value: queued && position ? `#${position}` : 'Sedang diputar', inline: true }
    );

  if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);
  if (track.info.uri) embed.setURL(track.info.uri);

  return embed;
}

export function createStatusEmbed({ color, title, description }) {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description);
}

export function createAiAnswerEmbed({ color, answer }) {
  return new EmbedBuilder().setColor(color).setTitle('💡 Jawaban').setDescription(answer.slice(0, 4000));
}

export function createRpsPanel(userId) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('## ✊ Rock Paper Scissors'))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('Pilih tangan kamu lewat tombol di bawah.'));

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`game:rps:${userId}:rock`).setLabel('✊ Rock').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`game:rps:${userId}:paper`).setLabel('✋ Paper').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`game:rps:${userId}:scissors`).setLabel('✌️ Scissors').setStyle(ButtonStyle.Danger)
  );

  return { components: [container, controls], flags: MessageFlags.IsComponentsV2 };
}

export function createTttPanel({ userId, board, statusText }) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❎ Tic Tac Toe'))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(statusText));

  const rows = [0, 1, 2].map((row) => {
    const rowBuilder = new ActionRowBuilder();
    for (let col = 0; col < 3; col += 1) {
      const idx = row * 3 + col;
      const value = board[idx];
      rowBuilder.addComponents(
        new ButtonBuilder()
          .setCustomId(`game:ttt:${userId}:${idx}`)
          .setLabel(value ?? `${idx + 1}`)
          .setStyle(value === 'X' ? ButtonStyle.Primary : value === 'O' ? ButtonStyle.Danger : ButtonStyle.Secondary)
          .setDisabled(Boolean(value))
      );
    }
    return rowBuilder;
  });

  return { components: [container, ...rows], flags: MessageFlags.IsComponentsV2 };
}


export function createGameResultPanel({ title, description }) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

export function formatQueue(queue) {
  if (!queue.current && queue.tracks.length === 0) {
    return 'Queue kosong.';
  }

  const now = queue.current ? `🎶 **Now**: ${queue.current.info.title}` : 'Tidak ada lagu aktif.';
  const next = queue.tracks.length
    ? queue.tracks.slice(0, 10).map((track, idx) => `${idx + 1}. ${track.info.title}`).join('\n')
    : 'Tidak ada antrian berikutnya.';

  return `${now}\n\n**Up Next**\n${next}`;
}

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
