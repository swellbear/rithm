import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class MLIntegration {
  constructor() {
    this.pythonPath = 'python3';
    this.trainerScript = join(__dirname, 'authentic-trainer.py');
  }

  async trainModel(data, algorithm, targetColumn) {
    return new Promise((resolve, reject) => {
      const input = JSON.stringify({
        data: data,
        algorithm: algorithm,
        target_column: targetColumn
      });

      const python = spawn(this.pythonPath, [this.trainerScript, input]);
      
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse ML results: ${error.message}`));
          }
        } else {
          reject(new Error(`ML training failed: ${stderr || 'Unknown error'}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
}