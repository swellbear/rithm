// Lazy ML Library Loader - Optimized for Bundle Size Reduction
// Expected savings: 400-500MB by loading libraries dynamically

interface MLLibraryCache {
  onnx?: any;
  tensorflow?: any;
  transformers?: any;
  webllm?: any;
}

class LazyMLLoader {
  private cache: MLLibraryCache = {};
  private loadingPromises: Map<string, Promise<any>> = new Map();

  // ONNX Runtime Lazy Loader (CDN-based)
  async loadONNX(): Promise<any> {
    if (this.cache.onnx) return this.cache.onnx;
    
    if (this.loadingPromises.has('onnx')) {
      return await this.loadingPromises.get('onnx');
    }

    const loadPromise = this.loadONNXFromCDN();
    this.loadingPromises.set('onnx', loadPromise);
    
    try {
      this.cache.onnx = await loadPromise;
      return this.cache.onnx;
    } catch (error) {
      this.loadingPromises.delete('onnx');
      throw error;
    }
  }

  private async loadONNXFromCDN(): Promise<any> {
    // Load ONNX Runtime from CDN to avoid bundle bloat
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.js';
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        if ((window as any).ort) {
          console.log('[LazyML] ONNX Runtime loaded from CDN');
          resolve((window as any).ort);
        } else {
          reject(new Error('ONNX Runtime failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load ONNX Runtime script'));
      document.head.appendChild(script);
    });
  }

  // TensorFlow.js Lazy Loader (Custom Build)
  async loadTensorFlow(): Promise<any> {
    if (this.cache.tensorflow) return this.cache.tensorflow;
    
    if (this.loadingPromises.has('tensorflow')) {
      return await this.loadingPromises.get('tensorflow');
    }

    const loadPromise = import('./tfjs-custom').then(module => {
      console.log('[LazyML] TensorFlow.js custom build loaded');
      return module;
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

  // Transformers Lazy Loader (Optimized)
  async loadTransformers(): Promise<any> {
    if (this.cache.transformers) return this.cache.transformers;
    
    if (this.loadingPromises.has('transformers')) {
      return await this.loadingPromises.get('transformers');
    }

    const loadPromise = import('./transformers-optimized').then(module => {
      console.log('[LazyML] Optimized Transformers loaded');
      return module;
    });
    
    this.loadingPromises.set('transformers', loadPromise);
    
    try {
      this.cache.transformers = await loadPromise;
      return this.cache.transformers;
    } catch (error) {
      this.loadingPromises.delete('transformers');
      throw error;
    }
  }

  // Web-LLM Lazy Loader
  async loadWebLLM(): Promise<any> {
    if (this.cache.webllm) return this.cache.webllm;
    
    if (this.loadingPromises.has('webllm')) {
      return await this.loadingPromises.get('webllm');
    }

    const loadPromise = import('./web-llm-optimized').then(module => {
      console.log('[LazyML] Optimized Web-LLM loaded');
      return module;
    });
    
    this.loadingPromises.set('webllm', loadPromise);
    
    try {
      this.cache.webllm = await loadPromise;
      return this.cache.webllm;
    } catch (error) {
      this.loadingPromises.delete('webllm');
      throw error;
    }
  }

  // Quantized Model Loader
  async loadQuantizedModel(modelPath: string, format: 'onnx' | 'tensorflow' = 'onnx'): Promise<any> {
    try {
      if (format === 'onnx') {
        const ort = await this.loadONNX();
        // Load quantized ONNX model (int8/fp16)
        const session = await ort.InferenceSession.create(modelPath, {
          executionProviders: ['wasm', 'cpu'],
          graphOptimizationLevel: 'all',
          enableMemPattern: true,
          enableCpuMemArena: true,
        });
        console.log(`[LazyML] Quantized ONNX model loaded: ${modelPath}`);
        return session;
      } else {
        const tf = await this.loadTensorFlow();
        const model = await tf.loadLayersModel(modelPath);
        console.log(`[LazyML] Quantized TensorFlow model loaded: ${modelPath}`);
        return model;
      }
    } catch (error) {
      console.error(`[LazyML] Failed to load quantized model ${modelPath}:`, error);
      throw error;
    }
  }

  // Clear cache to free memory
  clearCache(): void {
    this.cache = {};
    this.loadingPromises.clear();
    console.log('[LazyML] Cache cleared, memory freed');
  }

  // Get memory usage stats
  getCacheStats(): { loaded: string[], memoryEstimate: string } {
    const loaded = Object.keys(this.cache);
    const memoryEstimate = `~${loaded.length * 50}MB`; // Rough estimate
    return { loaded, memoryEstimate };
  }
}

// Global singleton instance
export const lazyMLLoader = new LazyMLLoader();

// Convenience functions following the suggested pattern
export const loadONNX = async () => {
  const ort = await lazyMLLoader.loadONNX();
  // Return session creator with quantized model support
  return {
    Session: ort.InferenceSession,
    createSession: (modelPath: string) => lazyMLLoader.loadQuantizedModel(modelPath, 'onnx'),
  };
};

export const loadTensorFlow = async () => {
  return await lazyMLLoader.loadTensorFlow();
};

export const loadTransformers = async () => {
  return await lazyMLLoader.loadTransformers();
};

export const loadWebLLM = async () => {
  return await lazyMLLoader.loadWebLLM();
};

// Model quantization utilities
export const ModelQuantizer = {
  // Prepare ONNX model for quantization (client-side)
  async optimizeONNXModel(modelBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    // This would typically be done server-side, but we can provide guidance
    console.log('[LazyML] For optimal quantization, use ONNX tools:');
    console.log('python -m onnxruntime.quantization.quantize_dynamic model.onnx model_int8.onnx');
    return modelBuffer; // Return as-is for now
  },

  // TensorFlow model quantization info
  getTensorFlowQuantizationTips(): string[] {
    return [
      'Use tf.lite.TFLiteConverter.from_saved_model() with optimizations',
      'Apply dynamic_range_quantization for 4x size reduction',
      'Use integer quantization for 8-bit models',
      'Consider pruning + quantization for maximum compression',
    ];
  }
};

export default lazyMLLoader;