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

export function createNowPlayingComponents(track, loopEnabled, color) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🎵 Sedang Diputar Sekarang')
    .setDescription(`**${track.info.title}**\n👤 ${track.info.author}`)
    .addFields(
      { name: '⏱️ Durasi', value: formatMs(track.info.length), inline: true },
      { name: '🔁 Loop', value: loopEnabled ? 'Aktif' : 'Mati', inline: true }
    );

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music:skip').setLabel('⏭️ Skip').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('music:loop').setLabel('🔁 Loop').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:stop').setLabel('⏹️ Stop').setStyle(ButtonStyle.Danger)
  );

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🎧 Kontrol Musik (Components V2)'))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Sedang memutar: **${track.info.title}**`)
    );

  return {
    embeds: [embed],
    components: [controls, container],
    flags: MessageFlags.IsComponentsV2
  };
}

export function createAIResponseComponents({ prompt, answer, isOwner, color }) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(isOwner ? '🧠 AI Owner Assistant' : '🤖 AI Member Assistant')
    .addFields(
      { name: '❓ Prompt', value: trimText(prompt, 1024) },
      { name: '💬 Jawaban', value: trimText(answer, 1024) }
    );

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('## ✨ Respon Gemini 2.5 Flash'))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        isOwner ? 'Mode persona: **Owner (detail + operasional)**' : 'Mode persona: **Member (ringkas + ramah)**'
      )
    );

  return {
    embeds: [embed],
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };
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

function trimText(text, max) {
  if (!text) return '-';
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}
