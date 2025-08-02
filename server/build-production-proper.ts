import { build } from "vite";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function buildProductionProper() {
  console.log("🏗️ Building ML Platform for Production (Proper Architecture)");
  
  try {
    // Step 1: Clean previous builds
    console.log("🧹 Cleaning previous builds...");
    if (fs.existsSync("dist")) {
      fs.rmSync("dist", { recursive: true, force: true });
    }
    
    // Step 2: Build client with Vite
    console.log("📦 Building client application...");
    await build({
      configFile: "vite.config.ts",
      mode: "production",
      build: {
        outDir: "dist/public",
        emptyOutDir: true,
        sourcemap: false,
        minify: true,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor': ['react', 'react-dom'],
              'ui': ['@radix-ui/react-accordion', '@radix-ui/react-dialog'],
              'charts': ['recharts', 'chart.js'],
              'ml': ['@tensorflow/tfjs', '@huggingface/transformers']
            }
          }
        }
      }
    });
    
    // Step 3: Copy production server files
    console.log("⚙️ Setting up production server...");
    
    // Create production structure
    fs.mkdirSync("dist/server", { recursive: true });
    
    // Copy production server files
    fs.copyFileSync("server/production/package.json", "dist/package.json");
    fs.copyFileSync("server/production/index.js", "dist/index.js");
    fs.copyFileSync("server/production/ml-integration.js", "dist/ml-integration.js");
    fs.copyFileSync("server/production/authentic-data-sources.js", "dist/authentic-data-sources.js");
    fs.copyFileSync("server/production/authentic-trainer.py", "dist/authentic-trainer.py");
    
    // Step 4: Install production dependencies
    console.log("📦 Installing production dependencies...");
    execSync("cd dist && npm install --only=production", { stdio: "inherit" });
    
    // Step 5: Copy essential files
    console.log("📄 Copying deployment files...");
    fs.copyFileSync("Dockerfile.production", "dist/Dockerfile");
    fs.copyFileSync("render-production.yaml", "dist/render.yaml");
    
    // Step 6: Create deployment package info
    const packageInfo = {
      name: "ml-platform-production",
      version: "1.0.0",
      build: {
        timestamp: new Date().toISOString(),
        architecture: "production-separated",
        clientSize: fs.existsSync("dist/public") ? getDirectorySize("dist/public") : "Not built",
        serverSize: fs.existsSync("dist/index.js") ? getFileSize("dist/index.js") : "Not built",
        dependencies: fs.existsSync("dist/package.json") ? getDependencyCount("dist/package.json") : 0
      },
      deployment: {
        type: "docker-multi-stage",
        dockerfile: "Dockerfile.production",
        config: "render-production.yaml",
        healthCheck: "/api/health",
        database: "postgresql"
      }
    };
    
    fs.writeFileSync("dist/deployment-info.json", JSON.stringify(packageInfo, null, 2));
    
    console.log("✅ Production build completed successfully!");
    console.log("📁 Output directory: dist/");
    console.log(`📊 Client size: ${getDirectorySize("dist/public")}`);
    console.log(`📊 Server size: ${getFileSize("dist/index.js")}`);
    console.log(`📦 Dependencies: ${getDependencyCount("dist/package.json")}`);
    console.log("");
    console.log("🚀 Ready for deployment:");
    console.log("1. Upload entire dist/ directory to GitHub");
    console.log("2. Use render-production.yaml for Render configuration");
    console.log("3. Docker will build using Dockerfile.production");
    
  } catch (error) {
    console.error("❌ Production build failed:", error);
    process.exit(1);
  }
}

function getDirectorySize(dir: string): string {
  let totalSize = 0;
  
  function calculateSize(directory: string) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        calculateSize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  }
  
  calculateSize(dir);
  return `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
}

function getFileSize(file: string): string {
  const stats = fs.statSync(file);
  return `${(stats.size / 1024).toFixed(2)} KB`;
}

function getDependencyCount(packageFile: string): number {
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
  return Object.keys(pkg.dependencies || {}).length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildProductionProper();
}