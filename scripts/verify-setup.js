#!/usr/bin/env node

/**
 * Setup Verification Script for GitString
 * Run with: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying GitString Setup...\n');

let hasErrors = false;
const warnings = [];

// Check if .env.local exists
console.log('1️⃣ Checking environment configuration...');
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('   ❌ .env.local file not found');
  console.log('   → Copy .env.example to .env.local and fill in your credentials\n');
  hasErrors = true;
} else {
  console.log('   ✅ .env.local file exists');
  
  // Read and check required variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
  ];
  
  const optionalVars = [
    'GITLAB_CLIENT_ID',
    'GITLAB_CLIENT_SECRET',
    'OPENAI_API_KEY',
  ];
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`${varName}=([^\\n]+)`);
    const match = envContent.match(regex);
    const value = match ? match[1].trim() : '';
    
    if (!match || !value || value.startsWith('your_')) {
      console.log(`   ❌ ${varName} is not configured`);
      hasErrors = true;
    } else {
      console.log(`   ✅ ${varName} is configured`);
    }
  });
  
  optionalVars.forEach(varName => {
    const regex = new RegExp(`${varName}=([^\\n]+)`);
    const match = envContent.match(regex);
    const value = match ? match[1].trim() : '';
    
    if (!match || !value || value.startsWith('your_')) {
      warnings.push(`${varName} is not configured (optional)`);
    } else {
      console.log(`   ✅ ${varName} is configured`);
    }
  });
  console.log();
}

// Check if node_modules exists
console.log('2️⃣ Checking dependencies...');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('   ❌ node_modules not found');
  console.log('   → Run: npm install\n');
  hasErrors = true;
} else {
  console.log('   ✅ Dependencies installed');
  
  // Check for key packages
  const packages = [
    '@supabase/supabase-js',
    'next',
    'react',
    'openai',
    'marked',
  ];
  
  packages.forEach(pkg => {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (fs.existsSync(pkgPath)) {
      console.log(`   ✅ ${pkg} installed`);
    } else {
      console.log(`   ❌ ${pkg} not found`);
      hasErrors = true;
    }
  });
  console.log();
}

// Check project structure
console.log('3️⃣ Checking project structure...');
const requiredDirs = [
  'app',
  'app/api',
  'app/dashboard',
  'lib',
  'lib/supabase',
  'supabase',
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`   ✅ ${dir}/ exists`);
  } else {
    console.log(`   ❌ ${dir}/ not found`);
    hasErrors = true;
  }
});
console.log();

// Check key files
console.log('4️⃣ Checking key files...');
const requiredFiles = [
  'package.json',
  'next.config.js',
  'tailwind.config.ts',
  'middleware.ts',
  'app/page.tsx',
  'app/layout.tsx',
  'lib/gitApi.ts',
  'lib/changelogLogic.ts',
  'supabase/schema.sql',
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} not found`);
    hasErrors = true;
  }
});
console.log();

// Display warnings
if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(warning => {
    console.log(`   • ${warning}`);
  });
  console.log();
}

// Final summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (hasErrors) {
  console.log('❌ Setup incomplete. Please fix the errors above.\n');
  console.log('📖 Need help? Check SETUP.md for detailed instructions.\n');
  process.exit(1);
} else {
  console.log('✅ Setup looks good!\n');
  console.log('🚀 Next steps:');
  console.log('   1. Make sure you\'ve set up Supabase:');
  console.log('      - Created a project');
  console.log('      - Run the schema from supabase/schema.sql');
  console.log('      - Enabled GitHub/GitLab OAuth providers\n');
  console.log('   2. Created OAuth apps:');
  console.log('      - GitHub OAuth App with correct callback URL');
  console.log('      - GitLab OAuth App (optional)\n');
  console.log('   3. Run the development server:');
  console.log('      npm run dev\n');
  console.log('   4. Open http://localhost:3000\n');
  console.log('📖 For detailed setup: see SETUP.md');
  console.log('🚢 For deployment: see DEPLOYMENT.md\n');
  process.exit(0);
}
