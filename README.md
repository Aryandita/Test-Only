# Discord Music Bot (Lavalink v4 + D.A.V.E + Gemini AI)

Template music bot Discord dengan:
- Lavalink v4 (D.A.V.E ready)
- Multi-source playback
- Tombol kontrol musik
- AI Gemini 2.5 Flash
- Semua respons command dalam format embed (component style) dengan warna yang bisa diatur pakai hex.

## Setup

```bash
npm install
cp .env.example .env
npm start
```

Isi `.env`:

```env
DISCORD_TOKEN=isi_token_discord_bot
PREFIX=!
STAY_24_7=false
OWNER_IDS=123456789012345678,987654321098765432
EMBED_COLOR=#5865F2

LAVALINK_HOST=hyperion.kythia.xyz
LAVALINK_PORT=3010
LAVALINK_PASSWORD=dsc.gg/kythia
LAVALINK_SECURE=false

LAVALINK_HOSTS=hyperion.kythia.xyz
LAVALINK_PORTS=3010
LAVALINK_PASSWORDS=dsc.gg/kythia
LAVALINK_SECURES=false

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

## Catatan AI

- Jawaban AI dibuat langsung ke inti.
- Tidak menampilkan deskripsi persona atau alur berpikir internal.

## Validasi cepat

```bash
npm run check
```
