import express from "express";
import { promises as fs } from "fs";
import path from "path";

const router = express.Router();

// Download route for .mlmodel files
router.get("/download/:modelName", async (req, res) => {
  try {
    const { modelName } = req.params;
    const modelsDir = path.join(process.cwd(), "models");
    const filePath = path.join(modelsDir, `${modelName}.mlmodel`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: "Model file not found" });
    }
    
    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Set headers for iOS compatibility
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${modelName}.mlmodel"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream file
    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);
    
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List available models
router.get("/models", async (req, res) => {
  try {
    const modelsDir = path.join(process.cwd(), "models");
    
    try {
      const files = await fs.readdir(modelsDir);
      const mlmodelFiles = files.filter(file => file.endsWith('.mlmodel'));
      
      const models = await Promise.all(
        mlmodelFiles.map(async (file) => {
          const filePath = path.join(modelsDir, file);
          const stats = await fs.stat(filePath);
          
          return {
            name: file.replace('.mlmodel', ''),
            filename: file,
            size: stats.size,
            modified: stats.mtime.toISOString()
          };
        })
      );
      
      res.json({ models });
      
    } catch {
      // Models directory doesn't exist yet
      res.json({ models: [] });
    }
    
  } catch (error) {
    console.error("Models list error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;