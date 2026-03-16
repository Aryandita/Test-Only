# Discord Music Bot (Basic + Lavalink)

Template basic untuk music bot Discord dengan command umum seperti **24/7**, **play**, dan command playback lain, menggunakan **Lavalink** sebagai audio backend.

## 1) Setup Environment

1. Install Node.js (minimal versi 18).
2. Clone project ini.
3. Install dependency:

```bash
npm install
```

4. Copy file environment:

```bash
cp .env.example .env
```

5. Isi `.env`:

```env
DISCORD_TOKEN=isi_token_discord_bot
PREFIX=!
STAY_24_7=false

LAVALINK_HOST=127.0.0.1
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
LAVALINK_SECURE=false
DEFAULT_SEARCH_SOURCE=ytsearch
```

Keterangan variabel:
- `DISCORD_TOKEN`: token bot dari Discord Developer Portal.
- `PREFIX`: awalan command (contoh `!play`).
- `STAY_24_7`: default mode 24/7 saat bot start (`true` atau `false`).
- `LAVALINK_HOST`: host Lavalink server.
- `LAVALINK_PORT`: port Lavalink server.
- `LAVALINK_PASSWORD`: password Lavalink server.
- `LAVALINK_SECURE`: `true` jika Lavalink pakai SSL.
- `DEFAULT_SEARCH_SOURCE`: source default untuk text query (`ytsearch`, `scsearch`, dll).

## 2) Setup Lavalink (bentuk/config)

Project ini menyertakan contoh konfigurasi di:

- `lavalink/application.yml.example`

Salin menjadi `application.yml`, lalu jalankan Lavalink server menggunakan file itu.

### Multi-source playback

Agar bot bisa memutar dari beberapa sumber (contoh YouTube search, SoundCloud, Spotify/Deezer/Apple Music), gunakan plugin Lavalink seperti:

- `youtube-source`
- `lavasrc-plugin`

> Catatan: dukungan source tergantung plugin yang kamu aktifkan di Lavalink server.

## 3) Menjalankan Bot

```bash
npm start
```

## 4) Command Basic Music Bot

- `!play <judul/url>`: Memutar lagu dari query atau URL (via Lavalink).
- `!skip`: Skip lagu yang sedang diputar.
- `!stop`: Stop playback dan bersihkan queue.
- `!pause`: Pause lagu saat ini.
- `!resume`: Lanjutkan lagu.
- `!volume <1-150>`: Atur volume.
- `!queue` atau `!q`: Menampilkan antrean lagu.
- `!nowplaying` atau `!np`: Menampilkan lagu yang sedang diputar (+ thumbnail jika tersedia).
- `!247`: Toggle mode 24/7 (bot stay setelah queue habis).
- `!leave`: Bot keluar dari voice channel.
- `!ping`: Menampilkan latency bot.
- `!help`: Menampilkan semua command.

> Jika prefix diubah di `.env`, maka semua command menyesuaikan.

## 5) Tombol Kontrol Musik

Saat lagu diputar, bot mengirim embed **Now Playing** dengan tombol:
- **Pause/Play**
- **Stop**
- **Loop** (track repeat)
- **Queue**
- **Volume +10**

Embed now playing juga akan menampilkan thumbnail lagu bila metadata source menyediakan URL thumbnail.

## 6) Permission Bot yang Dibutuhkan

Pastikan bot punya permission berikut:
- `View Channels`
- `Send Messages`
- `Read Message History`
- `Connect`
- `Speak`

## 7) Validasi Cepat

Jalankan pengecekan syntax:

```bash
npm run check
```
