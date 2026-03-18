# 🚀 BOOTSTRAP & SETUP GUIDE

> **Untuk user yang menggunakan hosting dan tidak bisa npm install**

---

## 📚 File-File Penting

### 1. **`src/bootstrap.js`** - Main Setup File
- ✅ Validate semua dependencies
- ✅ Check environment variables
- ✅ Load semua modules
- ✅ Provide helpful error messages

**Jalankan langsung:**
```bash
npm run validate
# atau
node src/bootstrap.js
```

### 2. **`check-deployment.js`** - Pre-Deployment Checker
- ✅ Full system validation
- ✅ File structure check
- ✅ Database connectivity test
- ✅ Discord bot settings validation

**Jalankan sebelum deploy:**
```bash
npm run deploy-check
# atau
node check-deployment.js
```

### 3. **`HOSTING_SETUP.md`** - Platform-Specific Guides
- Replit setup (easiest!)
- Railway setup
- Heroku setup
- VPS/Server setup
- PythonAnywhere setup
- Docker setup

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Copy Project
```bash
# Clone or download project files
git clone <your-repo> my-discord-bot
cd my-discord-bot
```

### Step 2: Install Dependencies (LOCAL ONLY)
```bash
# For local setup:
npm install

# For hosted - use platform's auto npm install or upload node_modules from local
```

### Step 3: Setup Environment Variables

#### Option A: Local (.env file)
```bash
# Create .env file in root folder:
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
BOT_OWNER_ID=your_discord_id
MONGODB_URI=mongodb+srv://user:pwd@cluster.mongodb.net/dbname
GEMINI_API_KEY=your_api_key
LAVALINK_HOST=your_lavalink_host
LAVALINK_PORT=2333
LAVALINK_PASSWORD=your_lavalink_password
BOT_LANGUAGE=id
BOT_PREFIX=!
```

#### Option B: Hosted (Use Platform Secrets/Env Vars)
- **Replit:** Secrets panel (lock icon)
- **Railway:** Settings → Variables
- **Heroku:** Config Vars
- **VPS:** .env file or ~/.bashrc

### Step 4: Test Setup
```bash
# Quick validation
npm run validate

# Full pre-deployment check
npm run deploy-check
```

### Step 5: Start Bot
```bash
# Local
npm start

# Hosted (platform handles this automatically)
```

---

## 🔍 Understanding Bootstrap Flow

```mermaid
graph TD
    A[npm start] --> B[Load bootstrap.js]
    B --> C{Dependencies Check}
    C -->|Missing| D[❌ ERROR - Show Missing Package]
    C -->|OK| E{Env Vars Check}
    E -->|Missing| F[❌ ERROR - Show Missing Env Var]
    E -->|OK| G[Load All Modules]
    G --> H[Discord.js Loaded]
    G --> I[MongoDB Connected]
    G --> J[Canvas Ready]
    G --> K[Shoukaku Loaded]
    H & I & J & K --> L[✅ Bootstrap Complete]
    L --> M[Initialize Services]
    M --> N[🤖 Bot Online]
```

---

## 📋 Available Scripts

```bash
# Start bot
npm start

# Validate dependencies only
npm run bootstrap
npm run validate

# Deploy commands to Discord
npm run deploy:commands

# Pre-deployment full check
npm run deploy-check

# Syntax check
npm run check

# Auto-setup (if available on platform)
npm run setup
```

---

## 🆘 Troubleshooting

### Error: "Cannot find module 'discord.js'"
```bash
# Make sure npm install ran:
npm install

# Verify packages are installed:
npm list discord.js

# Run bootstrap to get detailed error:
npm run bootstrap
```

### Error: "Missing environment variable X"
```bash
# Check .env file exists in root folder:
ls -la | grep .env

# Or check platform's secrets panel is set

# Run validation to see all missing vars:
npm run validate
```

### Bot Starts but doesn't respond
```bash
# Check all env vars are set:
node -e "console.log(process.env)"

# Validate Lavalink connection:
npm run validate

# Check logs for specific errors
```

### MongoDB Connection Error
```bash
# Verify MongoDB URI format:
# mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true

# Test in separate script:
node -e "const m=require('mongoose');m.connect(process.env.MONGODB_URI,{}).then(()=>console.log('✅ Connected')).catch(e=>console.log('❌',e.message))"
```

---

## 🎯 For Different Hosting Platforms

### REPLIT (Recommended for beginners)
```bash
# 1. Click "Import from GitHub"
# 2. Set secrets (lock icon):
#    DISCORD_TOKEN, MONGODB_URI, etc.
# 3. Click "Run" button
# Auto-npm install & start!
```

### RAILWAY
```bash
# 1. Connect GitHub repo
# 2. Set variables in Settings
# 3. Auto-deploys on push
```

### HEROKU
```bash
# 1. Create Procfile:
#    worker: npm start
# 2. Set config vars
# 3. Deploy: git push heroku main
```

### VPS (Ubuntu/Debian)
```bash
# 1. SSH to server
# 2. curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
# 3. sudo apt install nodejs npm
# 4. npm install
# 5. npm start
```

---

## 🔐 Security Checklist

- [ ] **Never commit .env to Git!** Add to .gitignore
- [ ] **Use strong passwords** in MongoDB URI
- [ ] **Keep Discord token secret** - never share
- [ ] **Use environment variables** for all secrets
- [ ] **Regular backups** of database
- [ ] **Update dependencies** regularly: `npm update`
- [ ] **Monitor bot logs** for errors

### .gitignore should have:
```
.env
.env.local
node_modules/
*.log
.DS_Store
```

---

## 📊 Pre-Deployment Checklist

Before going live:

```
✅ Dependency Validation
   □ discord.js installed
   □ mongoose installed
   □ All packages in package.json
   
✅ Environment Variables
   □ DISCORD_TOKEN set
   □ MONGO_URI configured
   □ LAVALINK_HOST accessible
   □ GEMINI_API_KEY valid
   □ BOT_OWNER_ID correct
   
✅ Bot Configuration
   □ Bot invited to test server
   □ Permissions set correctly
   □ Slash commands deployed
   □ Event handlers registered
   
✅ Database
   □ MongoDB connection works
   □ Database initialized
   □ Collections created
   
✅ Features
   □ Commands respond
   □ Music plays
   □ AI responds
   □ Economy works
   
✅ Deployment
   □ run: npm run deploy-check
   □ All checks pass ✅
   □ Ready to deploy!
```

---

## 📞 Getting Help

1. **Check Bootstrap Output:**
   ```bash
   npm run bootstrap
   ```
   Will show exactly what's missing/wrong with helpful solutions

2. **Run Full Validation:**
   ```bash
   npm run deploy-check
   ```
   Shows everything: file structure, dependencies, env vars, database

3. **Check Logs:**
   - Local: See console output
   - Platform: [See HOSTING_SETUP.md for platform-specific log viewing]

4. **Test Command:**
   ```bash
   # Test Discord connection
   npm run deploy:commands
   ```

---

## 🎉 You're Ready!

If all checks pass:
```
✨ YOUR BOT IS READY TO DEPLOY! ✨
```

Happy hosting! 🚀

---

**Need more help?**
- See `HOSTING_SETUP.md` for platform-specific guides
- Check error messages from `npm run bootstrap`
- Review `SYSTEMS_DOCUMENTATION.md` for feature details
