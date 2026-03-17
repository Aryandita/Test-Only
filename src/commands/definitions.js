import { SlashCommandBuilder } from 'discord.js';

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Putar lagu dari URL atau keyword YouTube')
    .addStringOption((opt) =>
      opt.setName('query').setDescription('🔍 URL atau kata kunci lagu').setRequired(true)
    ),
  new SlashCommandBuilder().setName('skip').setDescription('⏭️ Lewati lagu yang sedang diputar'),
  new SlashCommandBuilder().setName('stop').setDescription('⏹️ Hentikan musik dan keluar voice channel'),
  new SlashCommandBuilder().setName('queue').setDescription('📜 Lihat daftar antrian lagu saat ini'),
  new SlashCommandBuilder().setName('loop').setDescription('🔁 Aktifkan/nonaktifkan loop lagu saat ini'),
  new SlashCommandBuilder()
    .setName('ai')
    .setDescription('🤖 Tanya AI Gemini 2.5 Flash')
    .addStringOption((opt) => opt.setName('prompt').setDescription('💬 Pertanyaan kamu').setRequired(true)),
  new SlashCommandBuilder()
    .setName('rps')
    .setDescription('✊ Main Rock Paper Scissors lawan bot')
    .addStringOption((opt) =>
      opt
        .setName('pilihan')
        .setDescription('Pilih tangan kamu')
        .setRequired(true)
        .addChoices(
          { name: '✊ rock', value: 'rock' },
          { name: '✋ paper', value: 'paper' },
          { name: '✌️ scissors', value: 'scissors' }
        )
    ),
  new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('❎ Main Tic Tac Toe melawan bot')
    .addStringOption((opt) =>
      opt
        .setName('aksi')
        .setDescription('Mulai game baru atau lakukan langkah')
        .setRequired(true)
        .addChoices({ name: 'start', value: 'start' }, { name: 'move', value: 'move' })
    )
    .addIntegerOption((opt) =>
      opt
        .setName('posisi')
        .setDescription('Posisi 1-9 (wajib jika aksi=move)')
        .setMinValue(1)
        .setMaxValue(9)
    ),
  new SlashCommandBuilder().setName('restart').setDescription('♻️ Restart bot (khusus owner)'),
  new SlashCommandBuilder().setName('owner-stats').setDescription('👑 Lihat statistik runtime bot (owner only)'),
  new SlashCommandBuilder().setName('owner-sync').setDescription('🛠️ Sinkron ulang slash command (owner only)')
].map((command) => command.toJSON());
