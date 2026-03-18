/**
 * 🔥 BOOTSTRAP - DEPENDENCY & ENVIRONMENT VALIDATION
 * 
 * This file validates:
 * ✅ All required npm packages are installed
 * ✅ All required environment variables are set
 * 
 * Called from index.js as the first step before importing anything else.
 * 
 * ⚠️  CRITICAL: Dotenv must be loaded in index.js BEFORE calling this!
 */

import { join } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const nodeModulesPath = join(__dirname, '..', '..', 'node_modules');

// ============================================
// REQUIRED & OPTIONAL PACKAGES
// ============================================

const REQUIRED_PACKAGES = {
  'discord.js': '^14.19.3',
  'dotenv': '^16.4.7',
  'mongoose': '^8.0.0',
  'shoukaku': '^4.1.1',
  'canvas': '^2.11.2',
  'uuid': '^9.0.1'
};

const OPTIONAL_PACKAGES = {};

// ============================================
// REQUIRED & OPTIONAL ENV VARIABLES
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

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function validatePackageExists(packageName) {
  const packageJsonPath = join(nodeModulesPath, packageName, 'package.json');
  return {
    success: existsSync(packageJsonPath),
    error: !existsSync(packageJsonPath) ? `Cannot find module '${packageName}'` : null,
    expectedVersion: REQUIRED_PACKAGES[packageName] || OPTIONAL_PACKAGES[packageName] || 'unknown'
  };
}

function validateDependencies() {
  console.log('\n🔍 VALIDATING DEPENDENCIES...\n');
  
  let allValid = true;

  for (const [pkg, version] of Object.entries(REQUIRED_PACKAGES)) {
    const result = validatePackageExists(pkg);
    if (!result.success) {
      allValid = false;
      console.error(`❌ MISSING: ${pkg} ${version}`);
    } else {
      console.log(`✅ INSTALLED: ${pkg} ${version}`);
    }
  }

  console.log('\n' + '='.repeat(60));

  if (!allValid) {
    console.error('\n⛔ ERROR: Some required packages are not installed!');
    console.error('\n📝 FIX: Run "npm install" in the project root\n');
    process.exit(1);
  }

  console.log('✨ All dependencies validated!\n');
  return true;
}

function validateEnvironment() {
  console.log('🔐 VALIDATING ENVIRONMENT VARIABLES...\n');

  const missing = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
      console.error(`❌ MISSING: ${varName}`);
    } else {
      const value = varName.includes('TOKEN') || varName.includes('KEY') || varName.includes('PASSWORD')
        ? `***${process.env[varName].slice(-4)}`
        : process.env[varName].substring(0, 30);
      console.log(`✅ SET: ${varName}`);
    }
  }

  for (const varName of OPTIONAL_ENV_VARS) {
    if (!process.env[varName]) {
      console.warn(`⚠️  OPTIONAL: ${varName} (using default)`);
    } else {
      console.log(`✅ OPTIONAL: ${varName}`);
    }
  }

  console.log('\n' + '='.repeat(60));

  if (missing.length > 0) {
    console.error(`\n⛔ ERROR: Missing ${missing.length} required environment variables:\n`);
    missing.forEach((v, i) => {
      console.error(`   ${i + 1}. ${v}`);
    });
    
    console.error('\n📝 HOW TO FIX:');
    console.error('   - Create .env file in project root');
    console.error('   - Copy .env.example and fill in values');
    console.error('   - See .env.example for detailed instructions\n');
    
    process.exit(1);
  }

  console.log('✨ All environment variables validated!\n');
  return true;
}

/**
 * Main bootstrap function - called from index.js
 */
export async function initializeBootstrap() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 BOOTSTRAP STARTING...');
  console.log('='.repeat(60));

  try {
    // Validate dependencies and environment
    validateDependencies();
    validateEnvironment();

    console.log('✅ BOOTSTRAP COMPLETE - Bot ready to start!\n');
    return { success: true };
  } catch (error) {
    console.error('\n❌ Bootstrap failed:', error.message);
    process.exit(1);
  }
}
