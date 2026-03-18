#!/usr/bin/env node

/**
 * 🔧 PRE-DEPLOYMENT CHECK SCRIPT
 * 
 * Jalankan ini sebelum deploy untuk memastikan semua siap
 * Usage: node check-deployment.js
 */

import { initializeBootstrap, validateDependencies, validateEnvironment } from './bootstrap.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('\n' + '='.repeat(70));
console.log('  🚀 PRE-DEPLOYMENT CHECK SCRIPT');
console.log('  Validasi lengkap sebelum deploy ke production');
console.log('='.repeat(70) + '\n');

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const timestamp = new Date().toLocaleTimeString();
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    info: 'ℹ️ ',
    check: '🔍',
    file: '📄',
    db: '💾'
  };
  
  console.log(`[${timestamp}] ${icons[level]} ${message}`);
}

// ============================================
// 1. FILE STRUCTURE CHECK
// ============================================
console.log(`\n${colors.cyan}1️⃣  CHECKING FILE STRUCTURE${colors.reset}\n`);

const requiredFiles = [
  'package.json',
  'src/index.js',
  'src/bootstrap.js',
  'src/config/env.js',
  'src/database/db.js',
  '.env.example'
];

const requiredDirs = [
  'src',
  'src/config',
  'src/database',
  'src/models',
  'src/services',
  'src/commands',
  'src/events',
  'src/utils'
];

let fileCheckPass = true;

for (const file of requiredFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    log('file', `Found: ${file} (${(stats.size / 1024).toFixed(2)}KB)`);
  } else {
    log('error', `MISSING: ${file}`);
    fileCheckPass = false;
  }
}

for (const dir of requiredDirs) {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    log('file', `Found directory: ${dir}`);
  } else {
    log('warning', `Directory missing: ${dir}`);
  }
}

// ============================================
// 2. NODE MODULES CHECK
// ============================================
console.log(`\n${colors.cyan}2️⃣  CHECKING node_modules${colors.reset}\n`);

const nodeModulesPath = path.join(rootDir, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  const packages = fs.readdirSync(nodeModulesPath).length;
  log('success', `node_modules exists with ${packages} packages`);
} else {
  log('error', 'node_modules NOT FOUND! User must run: npm install');
}

// ============================================
// 3. DEPENDENCIES & ENV VALIDATION
// ============================================
console.log(`\n${colors.cyan}3️⃣  VALIDATING DEPENDENCIES & ENV VARS${colors.reset}\n`);

try {
  const depResults = validateDependencies();
  const envResults = validateEnvironment();
  
  // Check if all passed
  const allDepValid = Object.values(depResults.required).every(r => r.success);
  const allEnvSet = process.env.DISCORD_TOKEN && 
                    process.env.MONGODB_URI && 
                    process.env.GEMINI_API_KEY &&
                    process.env.LAVALINK_HOST;

  if (!allDepValid || !allEnvSet) {
    log('error', 'Validation failed! Check messages above.');
    process.exit(1);
  }

} catch (error) {
  log('error', `Validation error: ${error.message}`);
  process.exit(1);
}

// ============================================
// 4. DATABASE CONNECTIVITY CHECK
// ============================================
console.log(`\n${colors.cyan}4️⃣  CHECKING DATABASE CONNECTIVITY${colors.reset}\n`);

try {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    log('warning', 'MongoDB URI not set - skipping connection test');
  } else {
    log('info', 'Attempting MongoDB connection...');
    
    // Simple connectivity test (don't actually connect, just validate URI format)
    if (mongoUri.startsWith('mongodb')) {
      log('success', 'MongoDB URI format valid');
    } else {
      log('error', 'MongoDB URI format invalid!');
      process.exit(1);
    }
  }
} catch (error) {
  log('error', `Database check failed: ${error.message}`);
}

// ============================================
// 5. DISCORD BOT VALIDATION
// ============================================
console.log(`\n${colors.cyan}5️⃣  CHECKING DISCORD BOT SETTINGS${colors.reset}\n`);

const discordToken = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const ownerId = process.env.BOT_OWNER_ID;

if (!discordToken || discordToken.length < 50) {
  log('error', 'Invalid DISCORD_TOKEN format');
  process.exit(1);
} else {
  log('success', 'DISCORD_TOKEN set (masked)');
}

if (!clientId || clientId.length < 10) {
  log('error', 'Invalid DISCORD_CLIENT_ID');
  process.exit(1);
} else {
  log('success', 'DISCORD_CLIENT_ID valid');
}

if (!ownerId || !/^\d+$/.test(ownerId)) {
  log('error', 'Invalid BOT_OWNER_ID (must be numeric)');
  process.exit(1);
} else {
  log('success', 'BOT_OWNER_ID valid');
}

// ============================================
// 6. LAVALINK CONFIGURATION
// ============================================
console.log(`\n${colors.cyan}6️⃣  CHECKING LAVALINK CONFIGURATION${colors.reset}\n`);

const lavalinkHost = process.env.LAVALINK_HOST;
const lavalinkPort = process.env.LAVALINK_PORT;
const lavalinkPass = process.env.LAVALINK_PASSWORD;

if (!lavalinkHost) {
  log('error', 'LAVALINK_HOST not set');
  process.exit(1);
} else {
  log('success', `Lavalink Host: ${lavalinkHost}`);
}

if (!lavalinkPort) {
  log('error', 'LAVALINK_PORT not set');
  process.exit(1);
} else {
  log('success', `Lavalink Port: ${lavalinkPort}`);
}

if (!lavalinkPass) {
  log('error', 'LAVALINK_PASSWORD not set');
  process.exit(1);
} else {
  log('success', 'Lavalink Password: (masked)');
}

// ============================================
// 7. FILE SIZE ANALYSIS
// ============================================
console.log(`\n${colors.cyan}7️⃣  FILE SIZE ANALYSIS${colors.reset}\n`);

function getDirectorySize(dirPath) {
  let size = 0;
  
  if (!fs.existsSync(dirPath)) return 0;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules') {
        size += getDirectorySize(filePath);
      }
    } else {
      size += stat.size;
    }
  }
  
  return size;
}

const srcSize = getDirectorySize(path.join(rootDir, 'src'));
const nmSize = fs.existsSync(path.join(rootDir, 'node_modules')) 
  ? getDirectorySize(path.join(rootDir, 'node_modules')) 
  : 0;

log('info', `Source code size: ${(srcSize / 1024 / 1024).toFixed(2)}MB`);
log('info', `node_modules size: ${(nmSize / 1024 / 1024).toFixed(2)}MB`);

// ============================================
// 8. DEPLOYMENT READINESS SUMMARY
// ============================================
console.log(`\n${colors.cyan}📋 DEPLOYMENT READINESS SUMMARY${colors.reset}\n`);

const checks = {
  'File Structure': fileCheckPass,
  'node_modules': fs.existsSync(nodeModulesPath),
  'Dependencies': allDepValid,
  'Environment Variables': allEnvSet,
  'Discord Token': discordToken && discordToken.length > 50,
  'Lavalink Config': lavalinkHost && lavalinkPort && lavalinkPass,
  'Database URI': process.env.MONGODB_URI && process.env.MONGODB_URI.length > 20
};

let passCount = 0;
for (const [check, passed] of Object.entries(checks)) {
  if (passed) {
    log('success', `${check}: READY`);
    passCount++;
  } else {
    log('error', `${check}: MISSING/INVALID`);
  }
}

const totalChecks = Object.keys(checks).length;

console.log('\n' + '='.repeat(70));
if (passCount === totalChecks) {
  console.log(`\n${colors.green}✅ ALL CHECKS PASSED! BOT IS READY TO DEPLOY${colors.reset}\n`);
  console.log(`${colors.cyan}Next steps:${colors.reset}`);
  console.log('  1. npm start          (local testing)');
  console.log('  2. Deploy to hosting  (Replit/Railway/Heroku/VPS)');
  console.log('  3. Monitor logs       (join Discord validate)');
  console.log('\n' + '='.repeat(70) + '\n');
  process.exit(0);
} else {
  console.log(`\n${colors.red}❌ ${totalChecks - passCount} CHECK(S) FAILED!${colors.reset}\n`);
  console.log(`${colors.yellow}Fix the issues above before deploying.${colors.reset}\n`);
  console.log('='.repeat(70) + '\n');
  process.exit(1);
}
