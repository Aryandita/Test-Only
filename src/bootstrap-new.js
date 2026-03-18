/**
 * 🔥 BOOTSTRAP FILE - DEPENDENCY & ENVIRONMENT VALIDATION
 * 
 * FILE INI BERFUNGSI UNTUK:
 * ✅ Validate semua dependencies yang diperlukan (TANPA import dotenv)
 * ✅ Validate environment variables
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
 * 
 * ⚠️  IMPORTANT: Dotenv is loaded in index.js BEFORE bootstrap is called
 *    This prevents circular dependency issues with missing packages
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// ============================================
// 📦 DEPENDENCY VALIDATION (SYNCHRONOUS, ESM-SAFE)
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const nodeModulesPath = join(__dirname, '..', '..', 'node_modules');

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
 * Simple synchronous package check (no require.resolve, no dotenv import)
 */
function validatePackageExists(packageName) {
  const packagePath = join(nodeModulesPath, packageName);
  const packageJsonPath = join(packagePath, 'package.json');
  
  return {
    success: existsSync(packageJsonPath),
    error: existsSync(packageJsonPath) ? null : `Cannot find module '${packageName}'`,
    expectedVersion: REQUIRED_PACKAGES[packageName] || OPTIONAL_PACKAGES[packageName] || 'unknown'
  };
}

/**
 * Check semua required packages (SYNCHRONOUS - NO DOTENV REQUIRED)
 */
export function validateDependencies() {
  console.log('\n🔍 VALIDATING DEPENDENCIES...\n');
  
  const results = {
    required: {},
    optional: {},
    allValid: true
  };

  // Check required packages (synchronous file system check only)
  for (const [pkg, expectedVersion] of Object.entries(REQUIRED_PACKAGES)) {
    const result = validatePackageExists(pkg);
    results.required[pkg] = result;
    
    if (!result.success) {
      results.allValid = false;
      console.error(`❌ MISSING: ${pkg} ${expectedVersion}`);
      console.error(`   Error: ${result.error}`);
    } else {
      console.log(`✅ INSTALLED: ${pkg} ${expectedVersion}`);
    }
  }

  // Check optional packages
  for (const [pkg, expectedVersion] of Object.entries(OPTIONAL_PACKAGES)) {
    const result = validatePackageExists(pkg);
    results.optional[pkg] = result;
    
    if (!result.success) {
      console.warn(`⚠️  OPTIONAL MISSING: ${pkg} ${expectedVersion}`);
    } else {
      console.log(`✅ OPTIONAL INSTALLED: ${pkg} ${expectedVersion}`);
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
 * Validate environment variables (should be called AFTER dotenv is loaded)
 */
export function validateEnvironment() {
  console.log('\n🔐 VALIDATING ENVIRONMENT VARIABLES...\n');

  const missing = [];

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
    console.error('      (etc - see .env.example for all variables)\n');
    
    process.exit(1);
  }

  console.log('✨ ALL ENVIRONMENT VARIABLES VALIDATED!\n');
  return { required: REQUIRED_ENV_VARS, optional: OPTIONAL_ENV_VARS };
}

/**
 * Main bootstrap initialization function
 * Called from index.js AFTER dotenv is loaded
 */
export async function initializeBootstrap() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 DISCORD BOT BOOTSTRAP STARTING...');
    console.log('='.repeat(60));

    // Step 1: Validate dependencies
    validateDependencies();

    // Step 2: Validate environment variables (dotenv already loaded in index.js)
    validateEnvironment();

    console.log('\n' + '='.repeat(60));
    console.log('✅ BOOTSTRAP COMPLETED SUCCESSFULLY!');
    console.log('🎮 Bot is ready to connect to Discord...');
    console.log('='.repeat(60) + '\n');

    return { success: true };
  } catch (error) {
    console.error('\n❌ Bootstrap initialization failed:');
    console.error(error);
    process.exit(1);
  }
}
