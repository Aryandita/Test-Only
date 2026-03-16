# Discord Music + AI Bot (Node.js 24)

Bot Discord dengan fitur:
- Music player berbasis **Lavalink 4.2.2** (Shoukaku client).
- Kontrol tombol **Components V2** (skip/loop/stop).
- Integrasi AI **Gemini 2.5 Flash**.
- Persona AI berbeda untuk **owner** dan **member**.
- Command owner: `/restart`, `/owner-stats`, `/owner-sync`.
- Prefix command juga aktif (default `!`), contoh `!play`, `!ai`.

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
- `/ai` 🤖 tanya AI
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
- `!ai <prompt>`
- `!help`

## 6) AI Persona & Style
- **Owner persona**: respons detail, fokus operasional bot/troubleshooting.
- **Member persona**: respons ringkas, ramah, aman.
- Warna embed bisa pakai `AI_EMBED_COLOR_HEX` (legacy) atau `EMBED_HEX` (baru). Jika nilainya salah format, bot akan fallback ke `#5865F2` dan menampilkan warning.

## 7) Fix untuk Error "Bad Request" saat play
Pada versi ini, payload playback sudah disesuaikan dengan Lavalink v4 (`encodedTrack`) untuk mencegah error `Bad Request` saat memutar lagu.
