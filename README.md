# Discord Music + AI Bot (Node.js 24)

Bot Discord dengan fitur:
- Music player berbasis **Lavalink 4.2.2** (Shoukaku client).
- Kontrol tombol (skip/loop/stop) + embed informasi lagu.
- Integrasi AI **Gemini 2.5 Flash**.
- Persona AI berbeda untuk **owner** dan **member**.
- Command khusus owner: `/restart`, `/owner-stats`, `/owner-sync`.

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

LAVALINK_HOST=127.0.0.1
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false

GEMINI_API_KEY=
```

## 3) Jalankan Lavalink 4.2.2
Contoh `application.yml` penting:
```yml
server:
  port: 2333

lavalink:
  server:
    password: "youshallnotpass"
```

Run server Lavalink terlebih dulu, lalu:
```bash
npm run start
```

## 4) Slash Command
- `/play query:<url atau keyword>`
- `/skip`
- `/stop`
- `/queue`
- `/loop`
- `/ai prompt:<pertanyaan>`
- `/restart` (owner only)
- `/owner-stats` (owner only)
- `/owner-sync` (owner only)

## 5) Persona AI
- **Owner persona**: respons detail, fokus operasional bot, troubleshooting.
- **Member persona**: respons ringkas, ramah, aman.

Persona dipilih otomatis berdasarkan `interaction.user.id === BOT_OWNER_ID`.

## 6) Deploy command manual
```bash
npm run deploy:commands
```
