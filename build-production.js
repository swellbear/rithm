#!/usr/bin/env node

import { build } from 'esbuild';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting production build process...');

async function buildClient() {
  console.log('📦 Building client (React frontend)...');
  
  return new Promise((resolve, reject) => {
    const viteProcess = spawn('npm', ['run', 'build:client'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    viteProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Client build completed successfully');
        resolve();
      } else {
        reject(new Error(`Client build failed with code ${code}`));
      }
    });
  });
}

async function buildServer() {
  console.log('🔧 Building server (Node.js backend)...');
  
  try {
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: 'dist/index.js',
      external: [
        'canvas',
        'sharp',
        '@tensorflow/tfjs-node',
        'sqlite3',
        'pg-native',
        'cpu-features',
        'mock-aws-s3',
        'aws-sdk',
        'nock',
        '@mapbox/node-pre-gyp',
        'fsevents'
      ],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      sourcemap: false,
      minify: true,
      keepNames: true,
      banner: {
        js: '#!/usr/bin/env node\nimport { createRequire } from "module"; const require = createRequire(import.meta.url);'
      },
      resolveExtensions: ['.ts', '.js', '.json'],
      loader: {
        '.node': 'copy'
      }
    });
    
    console.log('✅ Server build completed successfully');
  } catch (error) {
    console.error('❌ Server build failed:', error);
    throw error;
  }
}

async function copyAssets() {
  console.log('📁 Copying server assets...');
  
  try {
    // Copy Python ML scripts
    await fs.mkdir('dist/ml', { recursive: true });
    await fs.copyFile('server/ml/authentic-trainer.py', 'dist/ml/authentic-trainer.py');
    
    // Copy any other server assets if they exist
    try {
      await fs.access('server/assets');
      await fs.cp('server/assets', 'dist/assets', { recursive: true });
    } catch {
      // Assets directory doesn't exist, skip
    }
    
    console.log('✅ Assets copied successfully');
  } catch (error) {
    console.error('❌ Asset copy failed:', error);
    throw error;
  }
}

async function createHealthEndpoint() {
  console.log('🏥 Ensuring health check endpoint...');
  
  const healthCheck = `
// Health check endpoint for deployment monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});
`;
  
  // This will be handled in the server code directly
  console.log('✅ Health endpoint configuration ready');
}

async function main() {
  try {
    const startTime = Date.now();
    
    // Build client and server in parallel for efficiency
    await Promise.all([
      buildClient(),
      buildServer()
    ]);
    
    // Copy necessary assets
    await copyAssets();
    
    // Ensure health endpoint
    await createHealthEndpoint();
    
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n🎉 Production build completed successfully!');
    console.log(`⏱️  Build time: ${buildTime}s`);
    console.log('📊 Build artifacts:');
    console.log('   - dist/index.js (server)');
    console.log('   - dist/client/* (frontend)');
    console.log('   - dist/ml/authentic-trainer.py (ML scripts)');
    console.log('\n🚀 Ready for deployment!');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Add build:client script if it doesn't exist
async function ensureBuildScripts() {
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    
    if (!packageJson.scripts['build:client']) {
      packageJson.scripts['build:client'] = 'vite build';
      await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
      console.log('✅ Added build:client script to package.json');
    }
  } catch (error) {
    console.log('ℹ️  Using existing package.json configuration');
  }
}

// Run the build
await ensureBuildScripts();
await main();
