# 🎵 Music System Upgrade Guide

## Perbaikan Autoplay yang Dilakukan

### ✅ Masalah yang Diselesaikan:
1. **Duplicate Tracks** - Sebelumnya sistem hanya menyimpan 20 ID terakhir, sekarang menyimpan hingga 150 track
2. **Spam Same Artist** - Algoritma baru membatasi artis yang sama muncul terlalu sering
3. **Similar Tracks** - Implementasi Levenshtein distance untuk mendeteksi lagu yang terlalu mirip
4. **Better Search Strategy** - Multiple search queries dengan rotasi strategy untuk variasi lebih baik

### 🔧 Teknis Improvements:

#### Sebelumnya:
```javascript
recentAutoplayIds: [] // Array sederhana, hanya 20 items
```

#### Sekarang:
```javascript
recentAutoplayIds: new Set(), // Set untuk O(1) lookup
recentArtists: [],             // Track artist frequency
lastAutoplayQuery: null        // Debug purposes
```

### 📊 Search Strategy:
Bot sekarang menggunakan 4 strategi pencarian yang berbeda:
1. `${artist} similar` - Cari lagu serupa dari artis
2. `${firstWords} mix` - Cari berdasarkan kata kunci lagu
3. `${artist} songs` - Lihat songlist artis
4. `${firstWords} playlist` - Cari playlist berdasarkan tema

### 🎯 Candidate Selection:
- Mengumpulkan 50+ kandidat dari semua strategi
- Filter track yang sudah dimainkan (Set dengan 150 history)
- Filter track yang judulnya terlalu mirip (similarity > 0.7)
- Limit artis yang sama (max 2 dari recentArtists)
- Random selection dari top 15 kandidat terbaik

---

## 🎨 Custom Emoji System

### Fitur Baru:
Tombol musik sekarang support **custom emoji** dari server Discord!

### Format yang Didukung:

#### Unicode Emoji (Default):
```env
EMOJI_SKIP=⏭️
EMOJI_LOOP=🔁
EMOJI_STOP=⏹️
EMOJI_LYRICS=📝
```

#### Custom Emoji Format:
```env
EMOJI_SKIP=<:skip:1234567890123456789>
EMOJI_LOOP=<:loop:9876543210987654321>
```

### Cara Mendapat Custom Emoji ID:

1. **Aktifkan Developer Mode** di Discord:
   - User Settings → Advanced → Developer Mode (ON)

2. **Klik Kanan Emoji** yang ingin digunakan:
   - Copy User ID (akan copy ID emoji)

3. **Format dalam .env:**
   ```
   <:emoji_name:123456789012345678>
   ```

### Emoji yang Bisa Dikustomisasi:

| Variable | Default | Fungsi |
|----------|---------|--------|
| `EMOJI_SKIP` | ⏭️ | Tombol skip track |
| `EMOJI_LOOP` | 🔁 | Tombol loop mode |
| `EMOJI_AUTOPLAY` | ♾️ | Tombol autoplay toggle |
| `EMOJI_STOP` | ⏹️ | Tombol stop musik |
| `EMOJI_LYRICS` | 📝 | Tombol lirik |
| `EMOJI_PLAYING` | ▶️ | Indikator sedang main |
| `EMOJI_PAUSED` | ⏸️ | Indikator pause |
| `EMOJI_QUEUE` | 📋 | Icon queue |
| `EMOJI_VOLUME` | 🔊 | Icon volume |
| `EMOJI_SUCCESS` | ✅ | Emoji sukses |
| `EMOJI_ERROR` | ❌ | Emoji error |

---

## 🎪 Embed Improvements

### Now Playing Embed - Lebih Informatif:

**Sebelumnya:**
```
Loop: Aktif
Autoplay: Mati
```

**Sekarang:**
```
Loop: ✔️ Aktif
Autoplay: ✖️ Mati
Status: Sedang diputar
```

### Status Embeds - Lebih Rapi:
- Added footer dengan branding Bot
- Better formatting dan spacing
- Konsisten dengan theme musik

### Game Result Panels:
- Added footer "🎮 Game Over"
- Better visual hierarchy

---

## 📝 Konfigurasi Lengkap

### .env.example
Semua emoji configuration sudah ada di `.env.example`:

```env
# Music Control Emojis
EMOJI_SKIP=⏭️
EMOJI_LOOP=🔁
EMOJI_AUTOPLAY=♾️
EMOJI_STOP=⏹️
EMOJI_LYRICS=📝

# Status Indicators
EMOJI_PLAYING=▶️
EMOJI_PAUSED=⏸️

# UI Elements
EMOJI_QUEUE=📋
EMOJI_VOLUME=🔊
EMOJI_SUCCESS=✅
EMOJI_ERROR=❌
```

---

## 🚀 Testing Music Features

### Test Autoplay:
```
1. Play: /play [song]
2. Toggle: /autoplay
3. Wait untuk auto transition
4. Check: Apakah lagu baru berbeda & berkualitas?
```

### Test Custom Emoji:
```
1. Set di .env: EMOJI_SKIP=<:custom:123456>
2. Run bot: npm start
3. Play musik
4. Check: Apakah tombol menampilkan custom emoji?
```

---

## 📊 Algorithm Details

### Levenshtein Distance (untuk similarity):
```
"Song Name (Remix)" vs "Song Name (Cover)"
Similarity: ~0.95 (SKIP - terlalu mirip)

"Song Name" vs "Other Song"
Similarity: ~0.30 (ACCEPT - cukup berbeda)
```

### Artist Frequency Tracking:
```
recentArtists = ["Artist A", "Artist A", "Artist B"]
Jika akan play "Artist A" lagi:
- Count "Artist A" = 2
- Jika >= 2: SKIP, cari artis lain
```

---

## ✨ Hasil Akhir

Music system sekarang:
- ✅ **Tidak spam track yang sama**
- ✅ **Variasi artis lebih baik**
- ✅ **Support custom emoji dari server**
- ✅ **Embed lebih rapi dan informatif**
- ✅ **150 track history** (dari 20 sebelumnya)
- ✅ **4 search strategies** untuk better variety
