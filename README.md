# Discord Music Bot (Lavalink v4 + D.A.V.E + Gemini AI)

Template music bot Discord dengan:
- Lavalink **v4 terbaru** (D.A.V.E ready)
- Multi-source playback (YouTube/SoundCloud/Spotify/Deezer/Apple Music via plugin)
- Tombol kontrol musik (pause/play, stop, loop, queue, volume)
- AI command memakai **Gemini 2.5 Flash** dengan persona terpisah untuk owner & member.

## 1) Setup Environment

1. Install Node.js (minimal versi 18).
2. Install dependency:

```bash
npm install
```

3. Copy file environment:

```bash
cp .env.example .env
```

4. Isi `.env`:

```env
DISCORD_TOKEN=isi_token_discord_bot
PREFIX=!
STAY_24_7=false
OWNER_IDS=123456789012345678,987654321098765432

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

Keterangan penting:
- `OWNER_IDS`: daftar user ID Discord owner (dipisahkan koma) untuk persona AI owner.
- `LAVALINK_HOSTS/PORTS/PASSWORDS/SECURES`: format multi-node (dipisahkan koma), prioritas utama untuk koneksi Lavalink.
- `LAVALINK_HOST/PORT/PASSWORD/SECURE`: fallback legacy single node.
- `GEMINI_MODEL`: default `gemini-2.5-flash`.

## 2) Setup Lavalink Terbaru (D.A.V.E ready)

Gunakan file contoh:
- `lavalink/application.yml.example`

Lalu jalankan Lavalink v4 terbaru (disarankan Java 21+). Contoh image:
- `ghcr.io/lavalink-devs/lavalink:4`

### Multi-source playback

Konfigurasi contoh sudah memuat plugin:
- `dev.lavalink.youtube:youtube-plugin`
- `com.github.topi314.lavasrc:lavasrc-plugin`

Dengan plugin di atas, kamu bisa pakai banyak sumber (tergantung konfigurasi provider plugin).

## 3) Menjalankan Bot

```bash
npm start
```

## 4) Command Music

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

### Tombol kontrol saat now playing

- Pause/Play
- Stop
- Loop
- Queue
- Volume +10

Now playing juga menampilkan thumbnail (jika metadata tersedia / fallback YouTube).

## 5) Command AI (Gemini)

- `!ai <pertanyaan>`

Sistem persona:
- **Owner Persona**: aktif jika user ID ada di `OWNER_IDS` (jawaban lebih teknis & operasional bot).
- **Member Persona**: default untuk user biasa (jawaban lebih ramah & sederhana).

## 6) Permission Bot

Pastikan bot punya permission:
- `View Channels`
- `Send Messages`
- `Read Message History`
- `Connect`
- `Speak`

## 7) Validasi cepat

```bash
npm run check
```
