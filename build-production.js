#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔧 Building ML Platform for production...');

try {
  // Build the React frontend
  console.log('📦 Building React frontend...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Build the production server (without dev dependencies)
  console.log('⚙️  Building production server...');
  execSync('esbuild server/production-index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production-server.js', { stdio: 'inherit' });
  
  // Copy package.json to dist
  console.log('📋 Copying package.json...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Create production package.json with only actual runtime dependencies
  const runtimeDeps = [
    'express', 'passport', 'passport-local', 'bcryptjs', 'connect-pg-simple',
    'express-session', 'express-rate-limit', 'cors', 'helmet', 'multer',
    'drizzle-orm', '@neondatabase/serverless', 'zod', 'zod-validation-error',
    'canvas', 'chart.js', 'chartjs-node-canvas', 'papaparse', 'js-yaml',
    'jszip', 'docx', 'openai', '@anthropic-ai/sdk', 'crypto-js', 'axios',
    'node-fetch', 'memorystore'
  ];
  
  const prodPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    type: packageJson.type,
    license: packageJson.license,
    dependencies: Object.fromEntries(
      Object.entries(packageJson.dependencies).filter(([key]) => 
        runtimeDeps.includes(key)
      )
    )
  };
  
  fs.writeFileSync('dist/package.json', JSON.stringify(prodPackageJson, null, 2));
  
  console.log('✅ Production build complete!');
  console.log('📁 Files created:');
  console.log('   - dist/public/ (React app)');
  console.log('   - dist/production-server.js (Node.js server)');
  console.log('   - dist/package.json (production dependencies)');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}