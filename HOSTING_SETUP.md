# 🚀 HOSTING SETUP GUIDE - UNTUK USERS TANPA NPM INSTALL

> File utama: `src/bootstrap.js` - Validate semua dependencies sebelum bot start

## 📋 Daftar Isi
1. [Cara Kerja](#cara-kerja)
2. [Setup di Replit](#replit)
3. [Setup di Railway](#railway)
4. [Setup di Heroku](#heroku)
5. [Setup di PythonAnywhere](#pythonanywhere)
6. [Setup di VPS (Ubuntu/CentOS)](#vps)
7. [Troubleshooting](#troubleshooting)

---

## 🔍 Cara Kerja

**Bootstrap file (`src/bootstrap.js`) akan:**
- ✅ Check semua required dependencies
- ✅ Validate semua environment variables
- ✅ Load semua modules yang diperlukan
- ✅ Throw error jika ada yang missing (dengan solusi clear)

**Jika ada missing:**
- ❌ Bot tidak akan start
- 📝 Error message akan suggest solusi

---

## 🎯 REPLIT

Replit paling mudah karena auto-install dependencies!

### Step 1: Import Project
```bash
# Di Replit, klik "Import from GitHub"
# Paste URL repo kamu atau upload files
```

### Step 2: Setup Secrets (Environment Variables)
```bash
# Klik ikon lock (🔒) di sidebar kiri → "Secrets"
# Add ini semua:

DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
BOT_OWNER_ID=your_discord_id_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/botname?retryWrites=true
GEMINI_API_KEY=your_gemini_api_key_here
LAVALINK_HOST=your_lavalink_host
LAVALINK_PORT=2333
LAVALINK_PASSWORD=your_lavalink_password

# Optional:
BOT_LANGUAGE=id
BOT_PREFIX=!
EMBED_HEX=#5865F2
```

### Step 3: Install Dependencies
```bash
# Replit auto-run npm install, tapi bisa force:
$ npm install

# Check bootstrap:
$ node src/bootstrap.js
```

### Step 4: Run Bot
```bash
# Via Replit UI: klik "Run" button
# Atau manual:
$ npm start
```

### ✅ Done!
Bot akan start dan validate semua dependencies otomatis.

---

## 🎯 RAILWAY

Railway juga support auto npm install!

### Step 1: Create New Project
- Login ke railway.app
- Click "New Project" → "Deploy from GitHub"
- Select repo kamu

### Step 2: Add Environment Variables
```bash
Panel Settings → Variables
Tambahkan semua env vars di atas (lihat Replit section)
```

### Step 3: Deploy
```bash
# Railway auto-run:
# 1. npm install
# 2. npm start

# Check logs di Railway dashboard
```

### ✅ Done!
Railway akan auto-npm install dan run.

---

## 🎯 HEROKU

Heroku sedikit berbeda, butuh Procfile.

### Step 1: Setup di Heroku
```bash
# Login
$ heroku login

# Create app
$ heroku create your-bot-name

# Add buildpacks
$ heroku buildpacks:add heroku/nodejs
```

### Step 2: Create Procfile (di root folder)
```bash
# Buat file: Procfile (tanpa extension)
worker: npm start
```

### Step 3: Add Environment Variables
```bash
# Via Heroku Dashboard atau CLI:
$ heroku config:set DISCORD_TOKEN=your_token
$ heroku config:set DISCORD_CLIENT_ID=your_id
$ heroku config:set BOT_OWNER_ID=your_id
$ heroku config:set MONGODB_URI=your_uri
$ heroku config:set GEMINI_API_KEY=your_key
$ heroku config:set LAVALINK_HOST=your_host
$ heroku config:set LAVALINK_PORT=2333
$ heroku config:set LAVALINK_PASSWORD=your_password
```

### Step 4: Deploy
```bash
$ git push heroku main  # atau master
```

### ✅ Done!
Check logs:
```bash
$ heroku logs --tail
```

---

## 🎯 PYTHONANYWHERE

PythonAnywhere bisa juga untuk Node.js (paid plan).

### Step 1: Setup Web App
- Login pythonanywhere.com
- "Web" → "Add a new web app"
- Choose Node.js

### Step 2: Upload Files
- "Files" tab
- Upload folder project

### Step 3: Environment Variables
```bash
# Edit file: ~/.bashrc (home folder)
# Tambahkan:
export DISCORD_TOKEN=your_token
export DISCORD_CLIENT_ID=your_id
export BOT_OWNER_ID=your_id
export MONGODB_URI=your_uri
export GEMINI_API_KEY=your_key
export LAVALINK_HOST=your_host
export LAVALINK_PORT=2333
export LAVALINK_PASSWORD=your_password

# Save & reload terminal
```

### Step 4: Install Dependencies
```bash
$ bash
$ cd your_project_folder
$ npm install
```

### Step 5: Run Bot
```bash
# Via console atau create script di "Web" tab:
$ npm start
```

### ✅ Done!
Bisa monitor di web tab.

---

## 🎯 VPS (Ubuntu/CentOS/Debian)

Untuk server tradisional atau dedicated hosting.

### Step 1: SSH ke Server
```bash
$ ssh user@your_server_ip
$ cd /home/user/bots  # atau folder mana saja
```

### Step 2: Install Node.js & npm
```bash
# Ubuntu 22.04+
$ curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
$ sudo apt-get install -y nodejs npm

# Verify
$ node --version  # Should be v24+
$ npm --version
```

### Step 3: Upload Project
```bash
# Option A: Git clone
$ git clone https://github.com/your-repo/bot.git
$ cd bot

# Option B: Upload via FTP/SCP
$ scp -r local_folder/ user@server:/home/user/bots/
```

### Step 4: Setup Environment Variables
```bash
# Create .env file
$ nano .env

# Paste ini:
DISCORD_TOKEN=your_token
DISCORD_CLIENT_ID=your_id
BOT_OWNER_ID=your_id
MONGODB_URI=your_uri
GEMINI_API_KEY=your_key
LAVALINK_HOST=your_host
LAVALINK_PORT=2333
LAVALINK_PASSWORD=your_password
BOT_LANGUAGE=id
BOT_PREFIX=!

# Save: Ctrl+X → Y → Enter
```

### Step 5: Install Dependencies
```bash
$ npm install

# Verify bootstrap:
$ node src/bootstrap.js
```

### Step 6: Run Bot
```bash
# Option A: Direct
$ npm start

# Option B: Screen (untuk background)
$ screen -S discord-bot
$ npm start
# Detach: Ctrl+A → D

# Option C: Systemd Service (persistent)
# Create: /etc/systemd/system/discord-bot.service
```

### Systemd Service Setup (Recommended untuk persistent)
```bash
# Create service file:
$ sudo nano /etc/systemd/system/discord-bot.service

# Paste ini:
[Unit]
Description=Discord Bot
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/home/your_username/bot
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target

# Save, then:
$ sudo systemctl daemon-reload
$ sudo systemctl enable discord-bot
$ sudo systemctl start discord-bot

# Check status:
$ sudo systemctl status discord-bot

# View logs:
$ sudo journalctl -u discord-bot -f
```

### ✅ Done!
Bot akan run terus-menerus.

---

## 🐳 DOCKER (Bonus)

Jika server support Docker:

### Step 1: Create Dockerfile
```dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src/ ./src/
COPY .env ./

CMD ["npm", "start"]
```

### Step 2: Create docker-compose.yml
```yaml
version: '3.8'

services:
  bot:
    build: .
    container_name: discord-bot
    environment:
      DISCORD_TOKEN: ${DISCORD_TOKEN}
      DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
      BOT_OWNER_ID: ${BOT_OWNER_ID}
      MONGODB_URI: ${MONGODB_URI}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      LAVALINK_HOST: ${LAVALINK_HOST}
      LAVALINK_PORT: ${LAVALINK_PORT}
      LAVALINK_PASSWORD: ${LAVALINK_PASSWORD}
    restart: unless-stopped
```

### Step 3: Run
```bash
$ docker-compose up -d
$ docker-compose logs -f
```

---

## ❌ TROUBLESHOOTING

### Error: "Cannot find package 'discord.js'"
**Solusi:**
```bash
# 1. Check npm install berhasil:
$ npm list discord.js

# 2. Jika tidak ada, install:
$ npm install discord.js

# 3. Verify:
$ node src/bootstrap.js
```

### Error: "ECONNREFUSED 127.0.0.1:27017" (MongoDB)
**Solusi:**
- Check `MONGODB_URI` di .env
- Pastikan MongoDB credentials benar
- Pastikan IP whitelist di MongoDB Atlas setting

### Error: "ERR_MODULE_NOT_FOUND: Cannot find module"
**Solusi:**
```bash
# Jalankan bootstrap check:
$ node src/bootstrap.js

# Will tell kamu package mana yang missing
# Lalu: npm install <package_name>
```

### Error: Discord Token Invalid
**Solusi:**
- Check token di botpal discord
- Paste ke DISCORD_TOKEN variable
- Make sure not copy-paste extra spaces

### Bot Start tapi tidak respond
**Solusi:**
```bash
# 1. Check env vars semua set:
$ node -e "console.log(process.env)"

# 2. Check Lavalink connection:
$ telnet your_lavalink_host 2333

# 3. Check MongoDB:
$ npm install mongodb
$ node -e "const {MongoClient}=require('mongodb');MongoClient.connect('your_uri',(e,c)=>{console.log(e?'❌ Error:'+e:'✅ Connected');process.exit();})"
```

### Still having issues?

**Generate Debug Report:**
```bash
$ node src/bootstrap.js > bootstrap_report.txt 2>&1

# Upload report & ask for help di:
# - Discord server support
# - GitHub issues
# - Email support
```

---

## ✨ BEST PRACTICES

### 1. Use PM2 for Auto-Restart (VPS)
```bash
$ npm install -g pm2

# Start bot:
$ pm2 start src/index.js --name discord-bot

# Auto-restart on reboot:
$ pm2 startup
$ pm2 save

# Monitor:
$ pm2 monit
```

### 2. Keep .env Secure
```bash
# NEVER push .env to Git!
# .gitignore should have:
.env
node_modules/
```

### 3. Regular Backups
```bash
# Backup database
$ mongodump --uri "mongodb+srv://..." --out ./backup

# Backup code & config
$ zip -r backup-$(date +%s).zip .env src/ config/
```

### 4. Monitor Bot Health
```bash
# Create health check script (check.js):
import { env } from './config/env.js';

console.log('🔍 Health Check:');
console.log('✅ Env loaded');
console.log('✅ Token:', process.env.DISCORD_TOKEN ? 'SET' : 'MISSING');
console.log('✅ MongoDB URI:', process.env.MONGODB_URI ? 'SET' : 'MISSING');
console.log('✅ All good!');

# Run:
$ node check.js
```

---

## 📞 NEED HELP?

1. **Check Bootstrap Report:**
   ```bash
   $ node src/bootstrap.js
   ```
   
2. **Check Logs:**
   ```bash
   # Replit: see output di console
   # Railway: Dashboard → Logs
   # Heroku: heroku logs --tail
   # VPS: systemctl status / journalctl
   ```

3. **Common Issues Checklist:**
   - [ ] All env variables set
   - [ ] MongoDB connection working
   - [ ] Discord token valid
   - [ ] Node.js version >= 24
   - [ ] npm dependencies installed
   - [ ] Lavalink host accessible

---

**Happy Hosting! 🎉**
