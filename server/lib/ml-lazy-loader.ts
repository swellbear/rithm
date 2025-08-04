// Server-side ML Library Lazy Loader for Node.js
// Implements the lazy loading pattern for backend ML operations

interface ServerMLCache {
  onnx?: any;
  tensorflow?: any;
}

class ServerMLLoader {
  private cache: ServerMLCache = {};
  private loadingPromises: Map<string, Promise<any>> = new Map();

  // Server-side ONNX Runtime Lazy Loader
  async loadONNX(): Promise<any> {
    if (this.cache.onnx) return this.cache.onnx;
    
    if (this.loadingPromises.has('onnx')) {
      return await this.loadingPromises.get('onnx');
    }

    // Dynamic import to avoid bundling ONNX Runtime
    const loadPromise = this.dynamicLoadONNX();
    this.loadingPromises.set('onnx', loadPromise);
    
    try {
      this.cache.onnx = await loadPromise;
      return this.cache.onnx;
    } catch (error) {
      this.loadingPromises.delete('onnx');
      throw error;
    }
  }

  private async dynamicLoadONNX(): Promise<any> {
    try {
      // Try to load onnxruntime-node if available (not bundled in package.json)
      // This would be installed on-demand or through optional dependencies
      const ort = await import('onnxruntime-node' as any);
      console.log('[ServerML] ONNX Runtime Node.js loaded successfully');
      return ort;
    } catch (error) {
      console.log('[ServerML] ONNX Runtime Node.js not available, falling back to web version');
      // Fallback to web version if node version not available
      try {
        const ortWeb = await import('onnxruntime-web' as any);
        return ortWeb;
      } catch (webError) {
        throw new Error('No ONNX Runtime available. Install onnxruntime-node for server use.');
      }
    }
  }

  // Server-side TensorFlow.js Lazy Loader
  async loadTensorFlow(): Promise<any> {
    if (this.cache.tensorflow) return this.cache.tensorflow;
    
    if (this.loadingPromises.has('tensorflow')) {
      return await this.loadingPromises.get('tensorflow');
    }

    const loadPromise = import('@tensorflow/tfjs-node' as any).then((tf: any) => {
      console.log('[ServerML] TensorFlow.js Node loaded');
      return tf;
    }).catch(() => {
      // Fallback to regular TensorFlow.js if node version not available
      console.log('[ServerML] Falling back to regular TensorFlow.js');
      return import('@tensorflow/tfjs' as any);
    });
    
    this.loadingPromises.set('tensorflow', loadPromise);
    
    try {
      this.cache.tensorflow = await loadPromise;
      return this.cache.tensorflow;
    } catch (error) {
      this.loadingPromises.delete('tensorflow');
      throw error;
    }
  }

  // Clear cache to free memory
  clearCache(): void {
    this.cache = {};
    this.loadingPromises.clear();
    console.log('[ServerML] Server ML cache cleared');
  }
}

// Global singleton for server
export const serverMLLoader = new ServerMLLoader();

// Convenience function following the suggested pattern
export const loadONNX = async () => {
  const ort = await serverMLLoader.loadONNX();
  
  // Return session creator with quantized model support
  return {
    InferenceSession: ort.InferenceSession,
    createSession: async (modelPath: string, options = {}) => {
      const defaultOptions = {
        executionProviders: ['cpu'], // Server typically uses CPU
        graphOptimizationLevel: 'all',
        enableMemPattern: true,
        enableCpuMemArena: true,
        logSeverityLevel: 3, // Only errors
        ...options
      };
      
      console.log(`[ServerML] Creating ONNX session for: ${modelPath}`);
      const session = await ort.InferenceSession.create(modelPath, defaultOptions);
      console.log(`[ServerML] ONNX session created successfully`);
      return session;
    }
  };
};

export default serverMLLoader;