#!/usr/bin/env node

/**
 * Interactive Supabase Configuration Setup
 * 
 * This script helps you configure your Supabase project WITHOUT editing any code files.
 * Just run it and follow the prompts!
 * 
 * Usage: npm run setup
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function printBanner() {
  console.log('\n' + '='.repeat(70));
  console.log('  🚀 Product Entry Hub - Supabase Configuration Setup');
  console.log('='.repeat(70) + '\n');
  console.log('This setup wizard will help you configure your Supabase project.');
  console.log('No manual code editing required!\n');
}

function printInstructions() {
  console.log('📋 Before you start, have these ready:\n');
  console.log('  1. Your Supabase Project URL');
  console.log('     Example: https://oqaodtatfzcibpfmhejl.supabase.co');
  console.log('     Find it: Supabase Dashboard → Project Settings → API\n');
  console.log('  2. Your Supabase Publishable (anon) Key');
  console.log('     Find it: Supabase Dashboard → Project Settings → API\n');
  console.log('  3. Your Supabase Project Reference ID');
  console.log('     Find it: Supabase Dashboard → Project Settings → General\n');
  console.log('-'.repeat(70) + '\n');
}

function extractProjectRef(url) {
  const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match ? match[1] : null;
}

function validateUrl(url) {
  const pattern = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i;
  return pattern.test(url);
}

function validateKey(key) {
  // Supabase anon keys typically start with 'eyJ' (JWT format)
  return key && key.length > 100 && key.startsWith('eyJ');
}

function validateProjectRef(ref) {
  // Project refs are alphanumeric lowercase strings
  return /^[a-z0-9]+$/.test(ref);
}

async function promptForConfig() {
  let supabaseUrl = '';
  let supabaseKey = '';
  let projectRef = '';

  // Step 1: Get Supabase URL
  console.log('📌 Step 1: Enter your Supabase Project URL');
  console.log('   (Example: https://oqaodtatfzcibpfmhejl.supabase.co)\n');
  
  while (true) {
    supabaseUrl = (await question('Supabase URL: ')).trim();
    
    // Remove trailing slash if present
    supabaseUrl = supabaseUrl.replace(/\/$/, '');
    
    if (validateUrl(supabaseUrl)) {
      const extractedRef = extractProjectRef(supabaseUrl);
      if (extractedRef) {
        console.log(`   ✓ Valid URL. Detected Project Ref: ${extractedRef}\n`);
        projectRef = extractedRef;
        break;
      }
    }
    console.log('   ✗ Invalid URL format. Please try again.\n');
  }

  // Step 2: Get Publishable Key
  console.log('📌 Step 2: Enter your Supabase Publishable (anon) Key');
  console.log('   (A long string starting with "eyJ...")\n');
  
  while (true) {
    supabaseKey = (await question('Publishable Key: ')).trim();
    
    if (validateKey(supabaseKey)) {
      console.log('   ✓ Valid key format\n');
      break;
    }
    console.log('   ✗ Invalid key format. Make sure you copied the full key.\n');
  }

  // Step 3: Confirm or override Project Reference
  console.log('📌 Step 3: Confirm your Project Reference ID');
  console.log(`   (We detected: ${projectRef})\n`);
  
  const confirmRef = await question(`Is "${projectRef}" correct? (Y/n): `);
  
  if (confirmRef.toLowerCase() === 'n') {
    while (true) {
      projectRef = (await question('Enter Project Reference: ')).trim();
      
      if (validateProjectRef(projectRef)) {
        console.log('   ✓ Valid project reference\n');
        break;
      }
      console.log('   ✗ Invalid format. Should be lowercase alphanumeric only.\n');
    }
  } else {
    console.log('   ✓ Using detected project reference\n');
  }

  return { supabaseUrl, supabaseKey, projectRef };
}

function createEnvFile(config) {
  const envPath = path.join(__dirname, '.env');
  const envContent = `VITE_SUPABASE_PROJECT_ID="${config.projectRef}"
VITE_SUPABASE_PUBLISHABLE_KEY="${config.supabaseKey}"
VITE_SUPABASE_URL="${config.supabaseUrl}"
`;

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('   ✓ Created .env file\n');
}

function updateSupabaseConfig(projectRef) {
  const configPath = path.join(__dirname, 'supabase', 'config.toml');
  
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8');
    configContent = configContent.replace(
      /project_id\s*=\s*"[^"]*"/,
      `project_id = "${projectRef}"`
    );
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('   ✓ Updated supabase/config.toml\n');
  }
}

function printNextSteps(config) {
  console.log('\n' + '='.repeat(70));
  console.log('  ✅ Configuration Complete!');
  console.log('='.repeat(70) + '\n');
  
  console.log('Your Supabase project is now configured:\n');
  console.log(`  • Project URL: ${config.supabaseUrl}`);
  console.log(`  • Project Ref: ${config.projectRef}`);
  console.log(`  • API Key: Configured ✓\n`);
  
  console.log('📋 NEXT STEPS:\n');
  
  console.log('1️⃣  Start the development server:');
  console.log('   npm run dev\n');
  
  console.log('2️⃣  Set up Google Sheets Integration (if needed):');
  console.log('   Follow the guide at: ./GOOGLE_SHEETS_SETUP.md\n');
  
  console.log('3️⃣  Configure GitHub Secrets for deployments:');
  console.log('   Go to: GitHub → Settings → Secrets and variables → Actions');
  console.log('   Add these secrets:');
  console.log(`   • SUPABASE_PROJECT_REF = ${config.projectRef}`);
  console.log('   • SUPABASE_ACCESS_TOKEN = (from https://supabase.com/dashboard/account/tokens)');
  console.log('   • SUPABASE_DB_PASSWORD = (your database password)\n');
  
  console.log('4️⃣  Deploy Edge Functions (if using Google Sheets):');
  console.log('   GitHub → Actions → "Deploy Google Sheets Connection" → Run workflow\n');
  
  console.log('💡 TIP: All configuration is saved in the .env file.');
  console.log('   Keep this file secure and never commit it to version control!\n');
  
  console.log('='.repeat(70) + '\n');
}

async function main() {
  try {
    printBanner();
    printInstructions();
    
    const config = await promptForConfig();
    
    console.log('💾 Saving configuration...\n');
    createEnvFile(config);
    updateSupabaseConfig(config.projectRef);
    
    printNextSteps(config);
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
