# Sistem Lengkap Bot Discord - Dokumentasi Lengkap

## 📋 Daftar Isi
1. [Ticket System](#ticket-system)
2. [Modmail System](#modmail-system)
3. [Welcomer System](#welcomer-system)
4. [Levelling System](#levelling-system)
5. [Music Profile System](#music-profile-system)
6. [Database Models](#database-models)
7. [Environment Variables](#environment-variables)

---

## 🎫 Ticket System

### Deskripsi
Sistem tiket untuk support, report, appeal, dan suggestion dari user di server.

### Commands
```
/ticket create [category] [subject] [description]
/ticket list
```

### Fitur
- ✅ Membuat tiket dengan kategori (support, report, appeal, suggestion)
- ✅ Tracking status tiket (open, in-progress, closed, resolved)
- ✅ Unique ticket ID (TK-XXXXXXXX)
- ✅ Response tracking dan conversation history
- ✅ Assignment ke staff/moderator
- ✅ Close ticket dengan alasan
- ✅ Priority level (low, medium, high, urgent)

### Database Model
```javascript
{
  ticketId: String (unique),
  guildId: String,
  userId: String,
  username: String,
  category: String (support|report|appeal|suggestion|other),
  subject: String,
  description: String,
  status: String (open|in-progress|closed|resolved),
  priority: String (low|medium|high|urgent),
  channelId: String (optional),
  responses: [{
    userId: String,
    username: String,
    message: String,
    timestamp: Date
  }],
  assignedTo: String,
  createdAt: Date,
  updatedAt: Date,
  closedAt: Date,
  closedBy: String,
  closeReason: String
}
```

### Contoh Usage
```
/ticket create support "Bot Crash" "Bot tidak merespons perintah"
/ticket list
```

---

## 💌 Modmail System

### Deskripsi
Sistem untuk user mengirim pesan privat ke staff server melalui bot.

### Commands
```
/modmail
```

### Fitur
- ✅ Automatic thread creation untuk setiap user
- ✅ DM to channel communication
- ✅ Staff assignment
- ✅ Internal notes untuk staff
- ✅ Message history tracking dengan timestamp
- ✅ Thread status management
- ✅ Tag system untuk organization
- ✅ Close thread dengan alasan
- ✅ Unique thread ID (MM-XXXXXXXXXXXX)

### Database Model
```javascript
{
  threadId: String (unique),
  guildId: String,
  userId: String,
  username: String,
  status: String (open|pending|closed|archived),
  channelId: String,
  dmChannelId: String,
  subject: String,
  messages: [{
    messageId: String,
    senderId: String,
    senderType: String (user|staff|system),
    senderName: String,
    content: String,
    attachments: [String],
    timestamp: Date
  }],
  assignedStaff: [String],
  tags: [String],
  notes: [{
    staffId: String,
    staffName: String,
    note: String,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date,
  closedAt: Date,
  closedBy: String,
  closeReason: String
}
```

### Contoh Usage
```
/modmail
(User akan mendapat informasi thread ID dan bisa DM bot)
```

---

## 👋 Welcomer System

### Deskripsi
Sistem welcome otomatis untuk member baru dengan custom image.

### Fitur
- ✅ Custom welcome message template
- ✅ Welcome image generation dengan canvas
- ✅ Custom channel untuk welcome
- ✅ Toggle welcome enabled/disabled
- ✅ Welcome role assignment (via external bot config)
- ✅ Guild settings management

### Setup Command
```
/setup-welcome [channel] [enabled] [message]
```

### Database Model (Guild)
```javascript
{
  guildId: String,
  guildName: String,
  
  // Welcome Settings
  welcomeEnabled: Boolean,
  welcomeChannelId: String,
  welcomeMessage: String (default: "Welcome {user} to {server}! 👋"),
  welcomeImageEnabled: Boolean
}
```

### Template Variables
- `{user}` - Mention user
- `{username}` - Username
- `{server}` - Server name
- `{memberCount}` - Jumlah member

### Generated Image Features
- Background gradient
- Username display
- "Enjoy your stay!" footer
- 1200x400 resolution

---

## 📊 Levelling System

### Deskripsi
Sistem level dan XP untuk chat activity di server.

### Commands
```
/level [user]
/level-leaderboard
```

### Fitur
- ✅ XP gain dari setiap message (5 XP per message)
- ✅ Level progression (100 XP per level)
- ✅ User rank tracking
- ✅ Leaderboard top 10
- ✅ Custom level badge images
- ✅ Level role rewards (guild configurable)
- ✅ Experience tracking dengan timestamp

### Calculation
```
XP_PER_MESSAGE = 5
XP_FOR_LEVEL = 100 (per level)
Example: Level 5 = 500 XP needed
```

### Database Model (User Extension)
```javascript
{
  // Existing user fields...
  experience: Number (default: 0),
  level: Number (default: 1)
}
```

### Level Badge Image
Features:
- Color-coded badges per level tier
- Level display prominent
- Experience progress bar
- Username display
- Animated gradient background
- 400x300 resolution

Color Tiers:
- Level 100+: Gold (#FFD700)
- Level 75+: Silver (#C0C0C0)
- Level 50+: Bronze (#CD7F32)
- Level 25+: Purple (#9370DB)
- Level 10+: Cyan (#00CED1)
- Level 1+: Green (#32CD32)

---

## 🎵 Music Profile System

### Deskripsi
Profile musik yang track statistik listening dengan visual image generator.

### Commands
```
/music-profile [user]
/music-leaderboard
```

### Fitur
- ✅ Track frequently played songs (top 20)
- ✅ Artist frequency tracking (top 15)
- ✅ Friends yang sering dengar bareng (top 10)
- ✅ Total listening time tracking
- ✅ Session count tracking
- ✅ Music level progression (100 XP per level)
- ✅ Timestamp untuk setiap update
- ✅ Custom image generation dengan profil data

### Music Statistics Tracked
```javascript
{
  frequentTracks: [{
    trackId: String,
    title: String,
    artist: String,
    url: String,
    playCount: Number,
    lastPlayedAt: Date,
    totalDuration: Number
  }],
  
  frequentArtists: [{
    artistName: String,
    playCount: Number,
    lastPlayedAt: Date,
    totalDuration: Number
  }],
  
  listeningFriends: [{
    friendId: String,
    friendName: String,
    listeningCount: Number,
    lastListenedTogether: Date
  }],
  
  totalTracksPlayed: Number,
  totalListeningTime: Number,
  totalListeningSessions: Number,
  musicLevel: Number,
  musicExperience: Number,
  currentStreak: Number,
  longestStreak: Number
}
```

### Database Model
```javascript
{
  userId: String (unique),
  guildId: String,
  username: String,
  frequentTracks: [{...}],
  frequentArtists: [{...}],
  listeningFriends: [{...}],
  totalTracksPlayed: Number,
  totalListeningTime: Number,
  totalListeningSessions: Number,
  musicLevel: Number,
  musicExperience: Number,
  currentStreak: Number,
  longestStreak: Number,
  favoriteGenre: String,
  lastUpdatedAt: Date,
  createdAt: Date
}
```

### Generated Images

#### Music Profile Image (800x500)
- Header dengan username
- Stats grid (4 stat boxes):
  - Total tracks
  - Listening time (formatted)
  - Sessions
  - Level
- Top 3 tracks dengan play count
- Top 3 artists dengan track count
- Updated timestamp

#### Music Comparison Image (600x400)
- Two-user comparison layout
- Favorite tracks dari kedua user
- Color-coded untuk setiap user
- Timestamp

---

## 🗄️ Database Models

### 1. User Model
Extended existing model dengan:
```javascript
{
  // Existing fields...
  experience: Number,
  level: Number
}
```

### 2. Ticket Model
```
src/database/models/Ticket.js
```

### 3. Modmail Model
```
src/database/models/Modmail.js
```

### 4. Guild Model
```
src/database/models/Guild.js
```

### 5. MusicProfile Model
```
src/database/models/MusicProfile.js
```

---

## 🔧 Environment Variables

Pastikan `.env` memiliki:
```env
# Core
TOKEN=your_bot_token
OWNER_ID=your_id

# MongoDB
MONGODB_URI=mongodb://localhost:27017/discord-bot

# API Keys
GEMINI_API_KEY=your_api_key

# Lavalink
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass

# Guild Settings
BOT_STATUS=online
BOT_ACTIVITY_TYPE=listening
BOT_ACTIVITY_TEXT=Discord Music

# Colors & Emojis
EMBED_HEX_COLOR=#00CED1
PREFIX=!

# Custom Emojis (optional)
EMOJIS_MUSIC_PLAY=🎵
EMOJIS_MUSIC_SKIP=⏭️
EMOJIS_MUSIC_STOP=⏹️
```

---

## 📦 Installed Packages

```json
{
  "canvas": "^2.11.2",
  "uuid": "^9.0.1"
}
```

Canvas untuk image generation
UUID untuk unique ID generation

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
- Pastikan MongoDB running
- Setup connection string di `.env`

### 3. Deploy Commands
```bash
npm run deploy:commands
```

### 4. Start Bot
```bash
npm start
```

---

## 📝 Service Files

### Ticket Service
```
src/services/ticket-service.js
```
Methods:
- `createTicket(guildId, userId, username, category, subject, description)`
- `addResponse(ticketId, userId, username, message)`
- `closeTicket(ticketId, closedBy, reason)`
- `getTicket(ticketId)`
- `getUserTickets(userId, guildId)`
- `getOpenTickets(guildId)`

### Modmail Service
```
src/services/modmail-service.js
```
Methods:
- `createThread(guildId, userId, username)`
- `addMessage(threadId, senderId, senderType, senderName, content, attachments)`
- `addNote(threadId, staffId, staffName, note)`
- `closeThread(threadId, closedBy, reason)`
- `getThread(threadId)`
- `getUserThread(guildId, userId)`
- `getOpenThreads(guildId)`

### Levelling Service
```
src/services/levelling-service.js
```
Methods:
- `addExperience(userId, amount)`
- `getLevel(userId)`
- `getLeaderboard(guildId, limit)`
- `getUserRank(userId)`

### Music Levelling Service
```
src/services/levelling-service.js
```
Methods:
- `updateMusicStats(guildId, userId, username, track, artist, friendId)`
- `getMusicProfile(userId, guildId)`
- `getMusicLeaderboard(guildId, limit)`

### Welcomer Service
```
src/services/welcomer-service.js
```
Methods:
- `getGuildSettings(guildId)`
- `updateWelcomeSettings(guildId, settings)`
- `generateWelcomeImage(username, profileImageUrl)`

---

## 🎨 Image Generation

### Level Image Generator
```
src/utils/level-image-generator.js
```
Functions:
- `generateLevelBadge(user, level, experience, nextLevelExp)`
- `generateProfileLevelImage(user, data)`

### Music Profile Generator
```
src/utils/music-profile-generator.js
```
Functions:
- `generateMusicProfileImage(musicData)`
- `generateMusicListeningComparisonImage(user1Data, user2Data)`

---

## ⚠️ Important Notes

1. **Canvas Installation**
   - Windows: Memerlukan Python 3 dan Visual Studio Build Tools
   - Linux: `sudo apt-get install build-essential python3`
   - Mac: Xcode Command Line Tools

2. **MongoDB Connection**
   - Bot akan warn tapi tetap jalan tanpa DB
   - Fitur akan error jika DB tidak tersambung

3. **Image Generation**
   - Canvas memerlukan memory yang cukup
   - Generate image untuk setiap level up/profile view

4. **Timestamp Format**
   - Semua timestamp menggunakan `Date.now()`
   - Format: ISO 8601

5. **Rate Limiting**
   - Discord rate limiting apply pada semua interactions
   - Image generation bisa lambat untuk banyak user

---

## 🔐 Security Features

- ✅ User ID validation
- ✅ Guild ID validation
- ✅ Owner-only commands untuk admin
- ✅ Database transaction safety
- ✅ Error handling untuk setiap operation
- ✅ Input sanitization

---

## 📊 Statistics & Metrics

Bot tracks:
- Total commands executed
- Total messages processed
- Total music profiles created
- Total tickets created
- Total leveling events
- Active guilds
- Active user database entries

---

## 🆘 Troubleshooting

### Canvas Issues
```bash
# Rebuild native modules
npm rebuild canvas
```

### MongoDB Connection
```javascript
// Check connection in logs
console.log('✅ MongoDB Connected Successfully!');
```

### Image Generation Fails
- Check canvas installation
- Verify node version (>=24.0.0)
- Check memory availability

### Commands Not Showing
```bash
npm run deploy:commands
```

---

## 📞 Support

Untuk issues atau pertanyaan:
1. Check documentation lengkap di atas
2. Verify `.env` configuration
3. Check MongoDB connection
4. Review command definitions
5. Check service methods implementation

---

Last Updated: March 18, 2026
Version: 1.0.0
