# Discord Music + AI Bot (Node.js 24)

Bot Discord dengan fitur:
- Music player via **Lavalink 4.2.2** + tombol kontrol (component v2 style via modern Discord components).
- Integrasi AI **Gemini 2.5 Flash**.
- Persona AI dipisah untuk **owner** dan **member**.
- Owner commands: `/restart`, `/shutdown`, `/announce`.

## 1) Persiapan

1. Install Node.js 24
2. Jalankan Lavalink 4.2.2
3. Isi `.env` berdasarkan `.env.example`

## 2) Install

```bash
npm install
```

## 3) Jalankan

```bash
npm start
```

## 4) Environment

- `DISCORD_TOKEN` token bot
- `CLIENT_ID` app/client id
- `OWNER_IDS` daftar user ID owner dipisah koma
- `GEMINI_API_KEY` API key Gemini
- `LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD`, `LAVALINK_SECURE`

## 5) Daftar command

- `/ping`
- `/play query:<teks>`
- `/skip`
- `/stop`
- `/queue`
- `/ai prompt:<teks>`
- `/restart` (owner)
- `/shutdown` (owner)
- `/announce pesan:<teks>` (owner)

> Untuk auto-restart setelah `/restart`, jalankan bot dengan process manager (PM2/systemd/docker restart policy).
