import { SlashCommandBuilder } from 'discord.js';

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Putar lagu favorit dari URL atau keyword YouTube')
    .addStringOption((opt) =>
      opt.setName('query').setDescription('🔎 URL atau kata kunci lagu yang ingin diputar').setRequired(true)
    ),
  new SlashCommandBuilder().setName('skip').setDescription('⏭️ Lewati lagu yang sedang diputar sekarang'),
  new SlashCommandBuilder().setName('stop').setDescription('⏹️ Hentikan musik dan keluar dari voice channel'),
  new SlashCommandBuilder().setName('queue').setDescription('📜 Lihat daftar antrian lagu saat ini'),
  new SlashCommandBuilder().setName('loop').setDescription('🔁 Aktifkan / matikan mode loop lagu'),
  new SlashCommandBuilder()
    .setName('ai')
    .setDescription('🤖 Tanya Gemini 2.5 Flash dengan persona otomatis')
    .addStringOption((opt) =>
      opt.setName('prompt').setDescription('💬 Pertanyaan yang ingin kamu tanyakan ke AI').setRequired(true)
    ),
  new SlashCommandBuilder().setName('restart').setDescription('♻️ Restart bot (khusus owner)'),
  new SlashCommandBuilder().setName('owner-stats').setDescription('🛠️ Lihat statistik bot (khusus owner)'),
  new SlashCommandBuilder().setName('owner-sync').setDescription('🔄 Sinkronisasi ulang slash command (khusus owner)')
].map((command) => command.toJSON());
