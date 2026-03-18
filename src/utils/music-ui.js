import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export function createMusicControlComponents(autoplayEnabled = false, twentyfourseven = false, env = {}) {
  const emojis = env.emojis ?? {
    skip: '⏭️',
    loop: '🔁',
    autoplay: '♾️',
    stop: '⏹️',
    lyrics: '📝'
  };

  // Row 1: Main controls
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music:skip').setLabel(`${emojis.skip} Skip`).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('music:loop').setLabel(`${emojis.loop} Loop`).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music:autoplay')
      .setLabel(autoplayEnabled ? `${emojis.autoplay} ON` : `${emojis.autoplay} OFF`)
      .setStyle(autoplayEnabled ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:stop').setLabel(`${emojis.stop} Stop`).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('music:lyrics').setLabel(`${emojis.lyrics} Lirik`).setStyle(ButtonStyle.Secondary)
  );

  // Row 2: Additional controls
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('music:247')
      .setLabel(`🔴 24/7 ${twentyfourseven ? 'ON' : 'OFF'}`)
      .setStyle(twentyfourseven ? ButtonStyle.Danger : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:queue').setLabel('📋 Queue').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:nowplaying').setLabel('🎵 Now Playing').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:volume-up').setLabel('🔊 Vol+').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music:volume-down').setLabel('🔉 Vol-').setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

export function createNowPlayingEmbed({ track, loopEnabled, autoplayEnabled, color, queued = false, position = null }) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(queued ? '✅ Lagu Ditambahkan ke Antrian' : '🎵 Sekarang Memutar')
    .setDescription(`**${track.info.title}**\n*by ${track.info.author}*`)
    .addFields(
      { name: '⏱️ Durasi', value: formatMs(track.info.length), inline: true },
      { name: '🔁 Loop', value: loopEnabled ? '✔️ Aktif' : '✖️ Mati', inline: true },
      { name: '♾️ Autoplay', value: autoplayEnabled ? '✔️ Aktif' : '✖️ Mati', inline: true },
      { name: '📍 Status', value: queued && position ? `Antrian #${position}` : 'Sedang diputar', inline: true }
    )
    .setFooter({ text: 'Gunakan tombol di bawah untuk mengontrol' });

  if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);
  if (track.info.uri) embed.setURL(track.info.uri);

  return embed;
}

export function createStatusEmbed({ color, title, description }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: '🎶 Music Bot' });
}

export function createAiAnswerEmbed({ color, answer }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('💡 Jawaban')
    .setDescription(answer.slice(0, 4000))
    .setFooter({ text: '🤖 Powered by Gemini AI' });
}

export function createRpsPanel(userId, color = 0x5865f2) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('✊ Rock Paper Scissors')
    .setDescription('Pilih tangan kamu lewat tombol di bawah.');

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`game:rps:${userId}:rock`).setLabel('✊ Rock').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`game:rps:${userId}:paper`).setLabel('✋ Paper').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`game:rps:${userId}:scissors`).setLabel('✌️ Scissors').setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [controls] };
}

export function createTttPanel({ userId, board, statusText, color = 0x5865f2 }) {
  const embed = new EmbedBuilder().setColor(color).setTitle('❎ Tic Tac Toe').setDescription(statusText);

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

  return { embeds: [embed], components: rows };
}

export function createGameResultPanel({ title, description, color = 0x5865f2 }) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: '🎮 Game Over' });
  return { embeds: [embed], components: [] };
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

// ===== ECONOMY EMBEDS =====
export function createBalanceEmbed({ user, rank, color = 0x5865f2 }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('💰 Saldo Uangmu')
    .setDescription(`
🤑 **${user.balance.toLocaleString('id-ID')}** IDK (In Discord Koin)
    `)
    .addFields(
      { name: '📊 Total Penghasilan', value: `💵 ${user.totalEarned.toLocaleString('id-ID')}`, inline: true },
      { name: '📊 Total Pengeluaran', value: `💸 ${user.totalSpent.toLocaleString('id-ID')}`, inline: true },
      { name: '🏅 Peringkat', value: `#${rank}`, inline: true },
      { name: '🔄 Streak Harian', value: `🔥 ${user.dailyRewardStreak} hari`, inline: true }
    )
    .setFooter({ text: '💎 Kumpulkan IDK untuk jadilah yang Terkaya! 💎' });
}

export function createDailyRewardEmbed({ reward, streak, canClaim, hoursLeft, color = 0x5865f2 }) {
  if (!canClaim) {
    const mins = Math.floor((hoursLeft % 1) * 60);
    return new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle('⏳ Daily Reward - Cooldown')
      .setDescription(`
Sabaaarrr! Reward kamu masih dalam cooldown 😅

⏰ **Waktu Tersisa:** ${Math.floor(hoursLeft)}jam ${mins}menit
      `)
      .setFooter({ text: '👉 Kembali lagi nanti ya! 👈' });
  }

  return new EmbedBuilder()
    .setColor(color)
    .setTitle('🎁 Daily Reward Diterima!')
    .setDescription(`
Selamat! Kamu mendapatkan reward harian! 🎉

💰 **Reward:** +${reward.toLocaleString('id-ID')} IDK
🔥 **Streak:** ${streak} hari berturut-turut
    `)
    .addFields(
      { name: '🎊 Bonus Streak', value: `+${(streak - 1) * 50} IDK`, inline: false }
    )
    .setFooter({ text: '✨ Jangan lupa kembali besok! ✨' });
}

export function createLeaderboardEmbed({ leaderboard, color = 0x5865f2 }) {
  const description = leaderboard
    .map((user, idx) => {
      const medals = ['🥇', '🥈', '🥉'];
      const medal = medals[idx] || `${idx + 1}.`;
      return `${medal} **${user.username}** - 💰 ${user.balance.toLocaleString('id-ID')} IDK`;
    })
    .join('\n') || 'Leaderboard masih kosong!';

  return new EmbedBuilder()
    .setColor(color)
    .setTitle('🏆 Leaderboard Top 10 Terkaya')
    .setDescription(description)
    .setFooter({ text: '🌟 Wujudkan impianmu untuk jadi yang terkaya! 🌟' });
}

export function createProfileEmbed({ user, rank, color = 0x5865f2 }) {
  const streak = user.dailyRewardStreak || 0;
  const lastDaily = user.lastDailyReward
    ? `<t:${Math.floor(user.lastDailyReward.getTime() / 1000)}:R>`
    : 'Belum pernah';

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`📊 Profil Ekonomi`)
    .setDescription(`
👤 **User:** ${user.username}
📍 **ID:** ${user.userId}
    `)
    .addFields(
      { name: '💰 Saldo Saat Ini', value: `🤑 ${user.balance.toLocaleString('id-ID')} IDK`, inline: false },
      { name: '📈 Statistik', value: `
✅ Total Penghasilan: ${user.totalEarned.toLocaleString('id-ID')} IDK
❌ Total Pengeluaran: ${user.totalSpent.toLocaleString('id-ID')} IDK
      `, inline: false },
      { name: '🔥 Daily Streak', value: `${streak} hari`, inline: true },
      { name: '⏰ Daily Terakhir', value: lastDaily, inline: true },
      { name: '🏅 Peringkat', value: `#${rank}`, inline: true }
    )
    .setFooter({ text: '💎 Terus kumpulkan uang untuk menjadi yang terkaya! 💎' })
    .setTimestamp();
}

export function createTransferEmbed({ fromUser, toUser, amount, color = 0x5865f2 }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('🎉 Transfer Berhasil!')
    .setDescription(`
Pembayaran telah selesai dengan suksessssss! 🎊
    `)
    .addFields(
      { name: '📤 Dari', value: `${fromUser} ✈️`, inline: false },
      { name: '📥 Ke', value: `${toUser} ⭐`, inline: false },
      { name: '💵 Jumlah', value: `${amount.toLocaleString('id-ID')} IDK`, inline: false }
    )
    .setFooter({ text: '✨ Berbagi adalah kebaikan! ✨' });
}

export function createTransferErrorEmbed({ reason, color = 0xFF6B6B }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('❌ Transfer Gagal')
    .setDescription(reason)
    .setFooter({ text: '😅 Coba lagi nanti!' });
}

export function createDailyCheckInEmbed(reward, streak, color = 0x5865f2) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('✅ Daily Check-In')
    .setDescription(`Kamu berhasil melakukan check-in setiap hari! 🎉`)
    .addFields(
      { name: '💰 Reward', value: `₦ ${reward.toLocaleString('id-ID')}`, inline: true },
      { name: '🔥 Streak', value: `${streak} hari`, inline: true },
      { name: 'Bonus', value: `+₦ ${(streak * 250).toLocaleString('id-ID')}`, inline: true }
    )
    .setFooter({ text: '⏰ Kembali besok untuk lebih banyak reward!' });
}

export function createWeeklyCheckInEmbed(reward, streak, color = 0x5865f2) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('📅 Weekly Check-In')
    .setDescription(`Mingguan check-in berhasil! Mantap! 🌟`)
    .addFields(
      { name: '💰 Reward', value: `₦ ${reward.toLocaleString('id-ID')}`, inline: true },
      { name: '📈 Streak', value: `${streak} minggu`, inline: true },
      { name: 'Bonus', value: `+₦ ${(streak * 5000).toLocaleString('id-ID')}`, inline: true }
    )
    .setFooter({ text: '🎊 Reward besar minggu depan menunggu!' });
}

export function createWorkRewardEmbed(jobName, salary, level, totalWorked, color = 0x5865f2) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('💼 Pekerjaan Selesai!')
    .setDescription(`Kamu berhasil menyelesaikan pekerjaan sebagai ${jobName}`)
    .addFields(
      { name: '💰 Gaji', value: `₦ ${salary.toLocaleString('id-ID')}`, inline: true },
      { name: '⚡ Level Multiplier', value: `${(level * 0.0001 * 100).toFixed(2)}%`, inline: true },
      { name: '📊 Total Pekerjaan', value: `${totalWorked} kali`, inline: true }
    )
    .setFooter({ text: '⏱️ Kembali dalam 1 jam untuk bekerja lagi!' });
}

export function createBegRewardEmbed(amountBegged, totalBegged, color = 0x5865f2) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('🤲 Meminta Selesai!')
    .setDescription(`Seseorang memberimu uang karena belas kasihan mereka! 😅`)
    .addFields(
      { name: '💰 Didapat', value: `₦ ${amountBegged.toLocaleString('id-ID')}`, inline: true },
      { name: '📊 Total Meminta', value: `${totalBegged} kali`, inline: true }
    )
    .setFooter({ text: '⏱️ Tunggu 30 menit sebelum meminta lagi!' });
}

export function createRaceResultEmbed(won, carName, reward, raceCount, winCount, color = 0x5865f2) {
  const resultTitle = won ? '🏁 KAMU MENANG BALAP!' : '🏁 Kamu Kalah Balap';
  const resultEmoji = won ? '🎉' : '😢';
  
  return new EmbedBuilder()
    .setColor(won ? 0x00FF00 : 0xFF0000)
    .setTitle(resultTitle)
    .setDescription(`Kendaraan: ${carName} ${resultEmoji}`)
    .addFields(
      { name: '💰 Reward', value: `${won ? '₦ ' + reward.toLocaleString('id-ID') : 'Tidak ada'}`, inline: true },
      { name: '📊 Total Balapan', value: `${raceCount}`, inline: true },
      { name: '🏆 Kemenangan', value: `${winCount}`, inline: true }
    )
    .setFooter({ text: '⏱️ Balap lagi dalam 45 menit!' });
}

export function createShopEmbed(color = 0x5865f2) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('🚗 Showroom Mobil')
    .setDescription(`Pilih mobil impianmu! Mereka siap membawamu pergi... jauh! 🏎️`)
    .addFields(
      { name: '🏎️ Civic', value: 'Harga: ₦ 50.000 | Kecepatan: 150 km/h', inline: false },
      { name: '🚙 Fortuner', value: 'Harga: ₦ 75.000 | Kecepatan: 120 km/h', inline: false },
      { name: '🏁 Lamborghini', value: 'Harga: ₦ 200.000 | Kecepatan: 300 km/h', inline: false },
      { name: '👑 Bugatti', value: 'Harga: ₦ 500.000 | Kecepatan: 380 km/h', inline: false },
      { name: '❤️ Ferrari', value: 'Harga: ₦ 350.000 | Kecepatan: 370 km/h', inline: false }
    )
    .setFooter({ text: 'Gunakan /shop buy [car_id] untuk membeli!' });
}

export function createBuyCarEmbed(carName, price, newBalance, color = 0x5865f2) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('✅ Pembelian Berhasil!')
    .setDescription(`Selamat! Kamu memiliki ${carName} baru! 🎊`)
    .addFields(
      { name: '🚗 Mobil', value: carName, inline: true },
      { name: '💳 Harga', value: `₦ ${price.toLocaleString('id-ID')}`, inline: true },
      { name: '💰 Saldo Baru', value: `₦ ${newBalance.toLocaleString('id-ID')}`, inline: true }
    )
    .setFooter({ text: '🏁 Gunakan mobilmu untuk balapan sekarang!' });
}

export function createLyricsEmbed(title, artist, lyrics, color = 0x5865f2) {
  const lyricsPreview = lyrics.slice(0, 2048);
  
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`📝 Lirik: ${title}`)
    .setDescription(`Artis: ${artist}`)
    .addFields({
      name: 'Lirik',
      value: lyricsPreview.length > 0 ? lyricsPreview : 'Lirik tidak ditemukan',
      inline: false
    })
    .setFooter({ text: 'Lirik dari sumber online' });
}


