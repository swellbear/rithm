import { build } from "esbuild";
import path from "path";
import fs from "fs";

// Production build script that excludes Vite dependencies
async function buildProduction() {
  console.log("🏗️  Building production server bundle...");
  
  try {
    // First, build the client with Vite
    console.log("📦 Building client with Vite...");
    const { execSync } = await import("child_process");
    execSync("vite build", { stdio: "inherit" });
    
    // Then build the server with esbuild - bundle all dependencies except native binaries
    console.log("⚡ Building server with esbuild...");
    await build({
      entryPoints: ["server/index.ts"],
      bundle: true,
      platform: "node",
      target: "node20",
      format: "cjs", // Use CommonJS to avoid dynamic import issues
      outfile: "dist/index.js",
      external: [
        // Node.js built-ins - let Node.js handle these
        "path",
        "fs",
        "http",
        "https",
        "crypto",
        "os",
        "child_process",
        "util",
        "stream",
        "events",
        "buffer",
        "url",
        "querystring",
        "zlib",
        // Native binary packages that can't be bundled
        "node-llama-cpp",
        "@node-llama-cpp/*",
        "@reflink/*",
        "canvas",
        "sharp",
        // Database client - external for proper native binding support
        "pg",
        "bcryptjs",
        // All node_modules should be external and installed on server
        "@huggingface/transformers",
        "@tensorflow/*",
        "onnxruntime-node"
      ],
      packages: "external", // External all node_modules
      define: {
        "process.env.NODE_ENV": '"production"'
      },
      sourcemap: false,
      minify: false, // Don't minify to make debugging easier
      treeShaking: true
    });
    
    console.log("✅ Production build completed successfully!");
    console.log("📁 Output: dist/index.js");
    console.log("📁 Client: dist/public/");
    
    // Verify build output
    const serverSize = fs.statSync("dist/index.js").size;
    console.log(`📊 Server bundle size: ${(serverSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error("❌ Production build failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildProduction();
}