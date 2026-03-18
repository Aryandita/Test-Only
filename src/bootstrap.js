/**
 * 🔥 BOOTSTRAP FILE - MAIN ENTRY POINT UNTUK SETUP & DEPENDENCIES
 * 
 * FILE INI BERFUNGSI UNTUK:
 * ✅ Validate semua dependencies yang diperlukan
 * ✅ Centralize semua imports utama
 * ✅ Provide error handling yang jelas
 * ✅ Support hosted users yang tidak bisa npm install
 * 
 * INSTRUKSI UNTUK HOSTED USERS:
 * 1. Upload folder project dengan SEMUA file
 * 2. Pastikan ada folder node_modules (atau upload dari lokal)
 * 3. Set environment variables di hosting panel:
 *    - DISCORD_TOKEN
 *    - DISCORD_CLIENT_ID
 *    - BOT_OWNER_ID
 *    - MONGODB_URI
 *    - GEMINI_API_KEY
 *    - LAVALINK_HOST, LAVALINK_PORT, LAVALINK_PASSWORD
 * 4. Jalankan: node src/index.js
 */

import 'dotenv/config';

// ============================================
// 📦 DEPENDENCY VALIDATION & IMPORTS
// ============================================

const REQUIRED_PACKAGES = {
  'discord.js': '^14.19.3',
  'dotenv': '^16.4.7',
  'mongoose': '^8.0.0',
  'shoukaku': '^4.1.1',
  'canvas': '^2.11.2',
  'uuid': '^9.0.1'
};

const OPTIONAL_PACKAGES = {
  // Package yang optional untuk beberapa fitur
};

/**
 * Validate apakah package bisa di-require
 */
function validatePackage(packageName) {
  try {
    require.resolve(packageName);
    return { success: true, version: getPackageVersion(packageName) };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      expectedVersion: REQUIRED_PACKAGES[packageName] || 'unknown'
    };
  }
}

/**
 * Get version dari package.json
 */
function getPackageVersion(packageName) {
  try {
    const pkg = require(`${packageName}/package.json`);
    return pkg.version;
  } catch {
    return 'unknown';
  }
}

/**
 * Check semua required packages
 */
export function validateDependencies() {
  console.log('\n🔍 VALIDATING DEPENDENCIES...\n');
  
  const results = {
    required: {},
    optional: {},
    allValid: true
  };

  // Check required packages
  for (const [pkg, expectedVersion] of Object.entries(REQUIRED_PACKAGES)) {
    const result = validatePackage(pkg);
    results.required[pkg] = result;
    
    if (!result.success) {
      results.allValid = false;
      console.error(`❌ MISSING: ${pkg} ${expectedVersion}`);
      console.error(`   Error: ${result.error}`);
    } else {
      console.log(`✅ INSTALLED: ${pkg} (v${result.version})`);
    }
  }

  // Check optional packages
  for (const [pkg, expectedVersion] of Object.entries(OPTIONAL_PACKAGES)) {
    const result = validatePackage(pkg);
    results.optional[pkg] = result;
    
    if (!result.success) {
      console.warn(`⚠️  OPTIONAL MISSING: ${pkg} ${expectedVersion}`);
    } else {
      console.log(`✅ OPTIONAL INSTALLED: ${pkg} (v${result.version})`);
    }
  }

  console.log('\n' + '='.repeat(60));

  if (!results.allValid) {
    console.error('\n⛔ CRITICAL ERROR: Beberapa required packages tidak terinstall!');
    console.error('\n📝 SOLUTION UNTUK HOSTED USERS:');
    console.error('   1. Jika menggunakan Replit/Railway/Heroku:');
    console.error('      - Upload requirements.txt atau package.json');
    console.error('      - Platform akan auto-install dependencies');
    console.error('   2. Jika menggunakan VPS/Dedicated Server:');
    console.error('      - SSH ke server');
    console.error('      - Run: npm install');
    console.error('   3. Jika upload dengan FTP/File Manager:');
    console.error('      - Upload folder node_modules dari komputer lokal');
    console.error('      - Atau gunakan hosting dengan auto npm install\n');
    process.exit(1);
  }

  console.log('✨ ALL DEPENDENCIES VALIDATED SUCCESSFULLY!\n');
  return results;
}

// ============================================
// 🔐 ENVIRONMENT VARIABLES VALIDATION
// ============================================

const REQUIRED_ENV_VARS = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'BOT_OWNER_ID',
  'MONGODB_URI',
  'GEMINI_API_KEY',
  'LAVALINK_HOST',
  'LAVALINK_PORT',
  'LAVALINK_PASSWORD'
];

const OPTIONAL_ENV_VARS = [
  'DISCORD_GUILD_ID',
  'BOT_PREFIX',
  'BOT_STATUS',
  'BOT_ACTIVITY_TYPE',
  'BOT_ACTIVITY_TEXT',
  'BOT_LANGUAGE',
  'EMBED_HEX',
  'AI_EMBED_COLOR_HEX'
];

/**
 * Validate environment variables
 */
export function validateEnvironment() {
  console.log('\n🔐 VALIDATING ENVIRONMENT VARIABLES...\n');

  const missing = [];
  const warning = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
      console.error(`❌ MISSING: ${varName}`);
    } else {
      // Mask sensitive values
      const value = varName.includes('TOKEN') || varName.includes('KEY') || varName.includes('PASSWORD')
        ? `***${process.env[varName].slice(-4)}`
        : process.env[varName];
      console.log(`✅ SET: ${varName} = ${value}`);
    }
  }

  for (const varName of OPTIONAL_ENV_VARS) {
    if (!process.env[varName]) {
      console.warn(`⚠️  OPTIONAL NOT SET: ${varName} (will use default)`);
    } else {
      console.log(`✅ OPTIONAL SET: ${varName}`);
    }
  }

  console.log('\n' + '='.repeat(60));

  if (missing.length > 0) {
    console.error(`\n⛔ MISSING ${missing.length} REQUIRED ENV VARIABLES:\n`);
    missing.forEach((v, i) => {
      console.error(`   ${i + 1}. ${v}`);
    });
    
    console.error('\n📝 HOW TO SET ENVIRONMENT VARIABLES:');
    console.error('\n   🖥️  REPLIT:');
    console.error('      - Click "Secrets" (lock icon) di sidebar');
    console.error('      - Add key-value pairs');
    console.error('      - Auto-set sebagai process.env\n');
    
    console.error('   🖥️  RAILWAY/HEROKU:');
    console.error('      - Go to Settings → Config Vars');
    console.error('      - Add environment variables');
    console.error('      - Will be available in process.env\n');
    
    console.error('   🖥️  VPS/SERVER:');
    console.error('      - Create .env file di root folder:');
    console.error('      DISCORD_TOKEN=your_token_here');
    console.error('      DISCORD_CLIENT_ID=your_client_id');
    console.error('      (etc...)\n');
    
    process.exit(1);
  }

  console.log('✨ ALL ENVIRONMENT VARIABLES VALIDATED!\n');
  return { required: REQUIRED_ENV_VARS, optional: OPTIONAL_ENV_VARS };
}

// ============================================
// 📥 CENTRALIZED IMPORTS (ALL MODULES)
// ============================================

/**
 * DISCORD.JS - Core Discord library
 */
export async function loadDiscordJs() {
  try {
    const { 
      Client, 
      GatewayIntentBits, 
      ActivityType, 
      REST, 
      Routes,
      EmbedBuilder,
      SlashCommandBuilder,
      ButtonBuilder,
      ButtonStyle,
      ActionRowBuilder,
      SelectMenuBuilder,
      ModalBuilder,
      TextInputBuilder,
      TextInputStyle,
      MessageFlags
    } = await import('discord.js');
    
    return {
      Client,
      GatewayIntentBits,
      ActivityType,
      REST,
      Routes,
      EmbedBuilder,
      SlashCommandBuilder,
      ButtonBuilder,
      ButtonStyle,
      ActionRowBuilder,
      SelectMenuBuilder,
      ModalBuilder,
      TextInputBuilder,
      TextInputStyle,
      MessageFlags
    };
  } catch (error) {
    throw new Error(`Failed to load discord.js: ${error.message}`);
  }
}

/**
 * MONGODB - Database
 */
export async function loadMongoose() {
  try {
    const mongoose = await import('mongoose');
    return mongoose.default;
  } catch (error) {
    throw new Error(`Failed to load mongoose: ${error.message}`);
  }
}

/**
 * CANVAS - Image generation untuk welcome card
 */
export async function loadCanvas() {
  try {
    const { createCanvas, registerFont, loadImage } = await import('canvas');
    return { createCanvas, registerFont, loadImage };
  } catch (error) {
    throw new Error(`Failed to load canvas: ${error.message}`);
  }
}

/**
 * UUID - Generate unique IDs
 */
export async function loadUUID() {
  try {
    const { v4: uuidv4 } = await import('uuid');
    return uuidv4;
  } catch (error) {
    throw new Error(`Failed to load uuid: ${error.message}`);
  }
}

/**
 * SHOUKAKU - Lavalink client untuk music
 */
export async function loadShoukaku() {
  try {
    const { Shoukaku, Connectors } = await import('shoukaku');
    return { Shoukaku, Connectors };
  } catch (error) {
    throw new Error(`Failed to load shoukaku: ${error.message}`);
  }
}

/**
 * ENVIRONMENT CONFIG
 */
export async function loadEnv() {
  try {
    const { env } = await import('./config/env.js');
    return env;
  } catch (error) {
    throw new Error(`Failed to load env config: ${error.message}`);
  }
}

// ============================================
// 🚀 COMPLETE BOOTSTRAP INITIALIZATION
// ============================================

/**
 * Initialize EVERYTHING needed before starting bot
 * Call ini di index.js sebagai: await initializeBootstrap()
 */
export async function initializeBootstrap() {
  console.log('\n🚀 STARTING BOOTSTRAP INITIALIZATION...\n');
  console.log('=' .repeat(60));

  try {
    // 1. Validate dependencies
    validateDependencies();

    // 2. Validate environment variables
    validateEnvironment();

    // 3. Load all modules
    console.log('\n📂 LOADING ALL MODULES...\n');

    const discordJs = await loadDiscordJs();
    console.log('✅ discord.js loaded');

    const mongoose = await loadMongoose();
    console.log('✅ mongoose loaded');

    const canvas = await loadCanvas();
    console.log('✅ canvas loaded');

    const uuidv4 = await loadUUID();
    console.log('✅ uuid loaded');

    const { Shoukaku, Connectors } = await loadShoukaku();
    console.log('✅ shoukaku loaded');

    const env = await loadEnv();
    console.log('✅ environment config loaded');

    console.log('\n' + '='.repeat(60));
    console.log('✨ BOOTSTRAP INITIALIZATION COMPLETE!\n');
    console.log('📝 All packages validated and ready to use\n');

    // Return semua modules yang sudah loaded
    return {
      discord: discordJs,
      mongoose,
      canvas,
      uuidv4,
      shoukaku: { Shoukaku, Connectors },
      env,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('\n❌ BOOTSTRAP INITIALIZATION FAILED!\n');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// ============================================
// 📋 EXPORT OBJECT UNTUK QUICK ACCESS
// ============================================

export const BootstrapConfig = {
  REQUIRED_PACKAGES,
  OPTIONAL_PACKAGES,
  REQUIRED_ENV_VARS,
  OPTIONAL_ENV_VARS,
  validateDependencies,
  validateEnvironment,
  loadDiscordJs,
  loadMongoose,
  loadCanvas,
  loadUUID,
  loadShoukaku,
  loadEnv,
  initializeBootstrap
};

// ============================================
// 🏃 RUN STANDALONE (untuk quick check)
// ============================================

// Jika file ini dijalankan langsung: node src/bootstrap.js
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('\n📊 RUNNING BOOTSTRAP VALIDATION STANDALONE\n');
  await initializeBootstrap().catch(error => {
    console.error('Error during standalone validation:', error);
    process.exit(1);
  });
}

export default BootstrapConfig;
