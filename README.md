# Discord Music Bot (Lavalink v4.2.2 + D.A.V.E + Gemini AI)

Template music bot Discord dengan:
- Lavalink v4.2.2 (D.A.V.E ready)
- Multi-source playback
- Tombol kontrol musik
- AI Gemini 2.5 Flash
- Semua respons command dalam format embed (component style) dengan warna yang bisa diatur pakai hex.

## Setup

Gunakan **Node.js 24** (LTS terbaru) agar environment konsisten dengan project ini.

```bash
nvm use 24
npm install
cp .env.example .env
npm start
```

Isi `.env`:

```env
NODE_ENV=production
DISCORD_TOKEN=isi_token_discord_bot
PREFIX=!
STAY_24_7=false
OWNER_IDS=123456789012345678,987654321098765432
EMBED_COLOR=#5865F2
BOT_STATUS=online
BOT_ACTIVITY_TYPE=LISTENING
BOT_ACTIVITY_TEXT=!help

LAVALINK_HOST=hyperion.kythia.xyz
LAVALINK_PORT=3010
LAVALINK_PASSWORD=dsc.gg/kythia
LAVALINK_SECURE=false

LAVALINK_HOSTS=hyperion.kythia.xyz
LAVALINK_PORTS=3010
LAVALINK_PASSWORDS=dsc.gg/kythia
LAVALINK_SECURES=false
LAVALINK_VERSION=v4
LAVALINK_USE_VERSION_PATH=true

DEFAULT_SEARCH_SOURCE=ytsearch

GEMINI_API_KEY=isi_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

## Command

- `!play <judul/url>`
- `!skip`
- `!stop`
- `!pause`
- `!resume`
- `!volume <1-150>`
- `!queue`
- `!nowplaying`
- `!247`
- `!leave`
- `!ping`
- `!color <hex>` (contoh: `!color #FF8800`)
- `!ai <pertanyaan>`
- Reply ke embed `🤖 AI Response` tanpa prefix untuk lanjut percakapan AI

## Catatan AI

- Jawaban AI dibuat langsung ke inti.
- Tidak menampilkan deskripsi persona atau alur berpikir internal.

## Validasi cepat

```bash
npm run check
```


## Status Activity Bot

Atur activity bot lewat env:
- `BOT_STATUS`: `online`, `idle`, `dnd`, `invisible`
- `BOT_ACTIVITY_TYPE`: `LISTENING`, `PLAYING`, `WATCHING`, `COMPETING`
- `BOT_ACTIVITY_TEXT`: teks activity (contoh: `!help`)


## Troubleshooting Lavalink (Unexpected server response: 200)

Jika muncul error `Unexpected server response: 200`, biasanya bot mengakses endpoint HTTP biasa, bukan websocket path Lavalink.
Pastikan env ini aktif:
- `LAVALINK_VERSION=v4`
- `LAVALINK_USE_VERSION_PATH=true`

Konfigurasi tersebut membuat client memakai path websocket versi Lavalink v4.


## Node Version Files

Project ini menyertakan:
- `.nvmrc` -> `24`
- `.node-version` -> `24`

Agar tooling seperti nvm/asdf/volta bisa otomatis menyesuaikan runtime.
