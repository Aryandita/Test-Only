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
  new SlashCommandBuilder().setName('autoplay').setDescription('♾️ Aktifkan/nonaktifkan autoplay rekomendasi'),
  new SlashCommandBuilder()
    .setName('ai')
    .setDescription('🤖 Tanya AI Gemini 2.5 Flash')
    .addStringOption((opt) => opt.setName('prompt').setDescription('💬 Pertanyaan kamu').setRequired(true)),
  new SlashCommandBuilder().setName('rps').setDescription('✊ Main Rock Paper Scissors via tombol'),
  new SlashCommandBuilder().setName('tictactoe').setDescription('❎ Main Tic Tac Toe via tombol'),
  new SlashCommandBuilder().setName('restart').setDescription('♻️ Restart bot (khusus owner)'),
  new SlashCommandBuilder().setName('owner-stats').setDescription('👑 Lihat statistik runtime bot (owner only)'),
  new SlashCommandBuilder().setName('owner-sync').setDescription('🛠️ Sinkron ulang slash command (owner only)'),
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('💰 Cek saldo uang kamu saat ini'),
  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('🎁 Ambil reward harian (cooldown 24 jam)'),
  new SlashCommandBuilder()
    .setName('give')
    .setDescription('🎉 Berikan uang ke user lain')
    .addUserOption((opt) => opt.setName('user').setDescription('👤 User penerima').setRequired(true))
    .addIntegerOption((opt) => opt.setName('amount').setDescription('💵 Jumlah uang').setRequired(true).setMinValue(1)),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 Lihat 10 user terkaya'),
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('📊 Lihat profil ekonomi kamu'),
  new SlashCommandBuilder()
    .setName('dailycheckin')
    .setDescription('📅 Daily Check-in (24 jam cooldown)'),
  new SlashCommandBuilder()
    .setName('weeklycheckin')
    .setDescription('📆 Weekly Check-in (7 hari cooldown)'),
  new SlashCommandBuilder()
    .setName('work')
    .setDescription('💼 Bekerja untuk mendapat uang (1 jam cooldown)'),
  new SlashCommandBuilder()
    .setName('beg')
    .setDescription('🥺 Minta-minta uang ke orang (30 menit cooldown)'),
  new SlashCommandBuilder()
    .setName('race')
    .setDescription('🏁 Balapan mobil (45 menit cooldown)'),
  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('🛍️ Belanja mobil atau lihat daftar mobil')
    .addStringOption((opt) =>
      opt.setName('action').setDescription('Action: list atau buy').setRequired(true)
        .addChoices({ name: 'list', value: 'list' }, { name: 'buy', value: 'buy' })
    )
    .addStringOption((opt) =>
      opt.setName('car').setDescription('ID mobil untuk dibeli (contoh: civic)').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎫 Buat atau kelola tiket support')
    .addStringOption((opt) =>
      opt.setName('action').setDescription('create atau list').setRequired(true)
        .addChoices({ name: 'create', value: 'create' }, { name: 'list', value: 'list' })
    )
    .addStringOption((opt) =>
      opt.setName('category').setDescription('Kategori tiket').setRequired(false)
        .addChoices(
          { name: 'support', value: 'support' },
          { name: 'report', value: 'report' },
          { name: 'appeal', value: 'appeal' },
          { name: 'suggestion', value: 'suggestion' }
        )
    )
    .addStringOption((opt) =>
      opt.setName('subject').setDescription('Subjek tiket').setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName('description').setDescription('Deskripsi lengkap').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('modmail')
    .setDescription('💌 Buka modmail untuk berkomunikasi dengan staff'),
  new SlashCommandBuilder()
    .setName('level')
    .setDescription('📊 Lihat level dan XP kamu atau user lain')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang ingin dilihat').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('level-leaderboard')
    .setDescription('🏆 Lihat top 10 user dengan level tertinggi'),
  new SlashCommandBuilder()
    .setName('music-profile')
    .setDescription('🎵 Lihat profil musik dan statistik listening')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang ingin dilihat').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('music-leaderboard')
    .setDescription('🎵 Lihat top 10 listener di server')
].map((command) => command.toJSON());
