# Discord Music + AI Bot (Node.js 24)

Bot Discord modern dengan fitur:
- 🎵 Music player berbasis **Lavalink 4.2.2** (Shoukaku).
- 🎛️ Kontrol tombol + **Components V2** untuk UI musik.
- 🤖 Integrasi AI **Gemini 2.5 Flash**.
- 👑 Persona AI terpisah untuk owner vs member.
- 🛠️ Command owner: `/restart`, `/owner-stats`, `/owner-sync`.
- ⚡ Prefix command juga aktif (default: `!`) contoh `!play`, `!ai`.

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
PREFIX=!

LAVALINK_HOST=127.0.0.1
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false

GEMINI_API_KEY=
AI_EMBED_COLOR_HEX=#00D2FF
MUSIC_EMBED_COLOR_HEX=#5865F2
```

## 3) Jalankan Lavalink 4.2.2
Contoh `application.yml` minimal:
```yml
server:
  port: 2333

lavalink:
  server:
    password: "youshallnotpass"
```

Jalankan Lavalink dulu, lalu:
```bash
npm run start
```

## 4) Slash Command (dengan deskripsi emoji)
- `/play` 🎵 Putar lagu dari URL/keyword.
- `/skip` ⏭️ Lewati lagu sekarang.
- `/stop` ⏹️ Stop + keluar voice.
- `/queue` 📜 Lihat antrian.
- `/loop` 🔁 Toggle loop.
- `/ai` 🤖 Tanya AI.
- `/restart` ♻️ Owner only.
- `/owner-stats` 🛠️ Owner only.
- `/owner-sync` 🔄 Owner only.

## 5) Prefix Command
Prefix default: `!`
- `!play <query>`
- `!skip`
- `!stop`
- `!queue`
- `!loop`
- `!ai <prompt>`
- `!restart` (owner)
- `!ownerstats` (owner)
- `!ownersync` (owner)

## 6) Persona AI
- **Owner persona**: respons detail, operasional, troubleshooting.
- **Member persona**: respons ramah, ringkas, aman.

Pemilihan persona berdasarkan `interaction/message author id === BOT_OWNER_ID`.

## 7) Deploy command manual
```bash
npm run deploy:commands
```
