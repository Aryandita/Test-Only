# Discord Music + AI Bot (Node.js 24)

Bot Discord dengan fitur:
- Music player berbasis **Lavalink 4.2.2** (Shoukaku client).
- Kontrol tombol musik + semua respon dirapikan dalam **embed berwarna dari hex di .env**.
- Integrasi AI **Gemini 2.5 Flash**.
- Persona AI berbeda untuk **owner** dan **member**.
- Command owner: `/restart`, `/owner-stats`, `/owner-sync`.
- Prefix command juga aktif (default `!`), contoh `!play`, `!ai`.
- Tersedia mini game: Rock Paper Scissors dan Tic Tac Toe.
- Saat `/play` dipakai ketika musik sedang berjalan, lagu akan otomatis masuk antrian.

## 1) Requirement
- Node.js **24+**
- Java 17+ (untuk Lavalink)
- Discord Bot Token
- Gemini API key

## 2) Instalasi
```bash
npm install
cp .env.example .env
```

Isi `.env`:
```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
BOT_OWNER_ID=
BOT_PREFIX=!
AI_EMBED_COLOR_HEX=#5865F2
EMBED_HEX=#5865F2

# Bot Presence
BOT_STATUS=online
BOT_ACTIVITY_TYPE=playing
BOT_ACTIVITY_TEXT=!help | Music & Mini Games

LAVALINK_HOST=127.0.0.1
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false

GEMINI_API_KEY=
```

## 3) Jalankan Lavalink 4.2.2
Contoh `application.yml`:
```yml
server:
  port: 2333

lavalink:
  server:
    password: "youshallnotpass"
```

Run Lavalink dulu, lalu bot:
```bash
npm run start
```

## 4) Slash Command (emoji + deskripsi)
- `/play` 🎵 putar lagu dari URL/keyword
- `/skip` ⏭️ skip lagu
- `/stop` ⏹️ stop dan leave
- `/queue` 📜 lihat antrian
- `/loop` 🔁 toggle loop
- `/autoplay` ♾️ toggle autoplay rekomendasi
- `/ai` 🤖 tanya AI
- `/rps` ✊ main rock paper scissors
- `/tictactoe` ❎ main tic tac toe
- `/restart` ♻️ owner only
- `/owner-stats` 👑 owner only
- `/owner-sync` 🛠️ owner only

## 5) Prefix Command
Prefix default `!` (ubah via `BOT_PREFIX`).
- `!play <query>`
- `!skip`
- `!stop`
- `!queue`
- `!loop`
- `!autoplay`
- `!ai <prompt>`
- `!rps <rock/paper/scissors>`
- `!tictactoe start`
- `!tictactoe <1-9>`
- `!help`

## 6) AI Persona & Style
AI dirancang menjawab langsung ke inti tanpa menyebut model dan tanpa salam pembuka/penutup.
- **Owner persona**: respons detail, fokus operasional bot/troubleshooting.
- **Member persona**: respons ringkas, ramah, aman.
- Warna embed bisa pakai `AI_EMBED_COLOR_HEX` (legacy) atau `EMBED_HEX` (baru). Jika nilainya salah format, bot akan fallback ke `#5865F2` dan menampilkan warning.

## 7) Fix untuk Error "Bad Request" saat play
Pada versi ini, payload playback sudah disesuaikan dengan Lavalink v4 (`encodedTrack`) untuk mencegah error `Bad Request` saat memutar lagu.


## 8) Tampilan Embed
- Semua pesan command utama (play/skip/stop/queue/loop/ai/help) menggunakan embed dengan warna dari `EMBED_HEX` atau `AI_EMBED_COLOR_HEX`.
- `/play` menampilkan thumbnail dari `artworkUrl` jika tersedia.


## 9) Bot Activity & Status
Atur status/activity bot lewat env:
- `BOT_STATUS`: `online`, `idle`, `dnd`, `invisible`
- `BOT_ACTIVITY_TYPE`: `playing`, `listening`, `watching`, `competing`
- `BOT_ACTIVITY_TEXT`: teks activity bot


## 10) Autoplay & AI Chat Thread
- Aktifkan autoplay lewat `/autoplay`, `!autoplay`, atau tombol `♾️ Autoplay`.
- Saat lagu berakhir dan lanjut ke lagu berikutnya, bot otomatis kirim panel musik baru agar tombol skip/loop/autoplay/stop tetap mudah diakses.
- Untuk AI, kamu bisa **reply** pesan jawaban AI lalu lanjut tanya; bot akan melanjutkan konteks obrolan di channel yang sama.
