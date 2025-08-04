// Optimized web-llm setup with lazy loading and polyfills
import type { MLCEngineInterface, ChatCompletionRequest } from '@mlc-ai/web-llm';

// Polyfills for bundler compatibility
if (typeof performance === 'undefined') {
  // @ts-ignore
  globalThis.performance = {
    now: () => Date.now(),
    mark: (markName: string): any => ({ name: markName, entryType: 'mark', startTime: Date.now(), duration: 0 }),
    measure: (measureName: string): any => ({ name: measureName, entryType: 'measure', startTime: Date.now(), duration: 0 }),
    clearMarks: () => {},
    clearMeasures: () => {}
  };
}

// Lazy-loaded engine cache
let webLLMEngine: MLCEngineInterface | null = null;
let enginePromise: Promise<MLCEngineInterface> | null = null;

// Optimized model configurations
const optimizedModelConfigs = {
  'phi-3-mini': {
    model: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx-web/resolve/main/',
    model_id: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
    model_lib_url: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/phi-3-mini-4k-instruct/phi-3-mini-4k-instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm',
    vram_required_MB: 2048,
    low_resource_required: false,
    buffer_size_required_bytes: 262144000
  }
};

// Lazy engine loader with error handling
export const getOptimizedWebLLMEngine = async (): Promise<MLCEngineInterface> => {
  if (webLLMEngine) {
    return webLLMEngine;
  }
  
  if (enginePromise) {
    return await enginePromise;
  }
  
  enginePromise = (async () => {
    try {
      console.log('[web-llm] Lazy loading engine...');
      
      // Dynamic import to avoid bundling issues
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      
      const engine = await CreateMLCEngine('Phi-3-mini-4k-instruct-q4f16_1-MLC', {
        initProgressCallback: (progress: { progress: number }) => {
          console.log(`[web-llm] Loading progress: ${(progress.progress * 100).toFixed(1)}%`);
        }
      });
      
      webLLMEngine = engine;
      console.log('[web-llm] Engine loaded successfully');
      return engine;
      
    } catch (error) {
      console.error('[web-llm] Engine loading failed:', error);
      enginePromise = null; // Reset for retry
      throw error;
    }
  })();
  
  return await enginePromise;
};

// Optimized chat completion with streaming
export class OptimizedWebLLMChat {
  private engine: MLCEngineInterface | null = null;
  
  async initialize() {
    if (!this.engine) {
      this.engine = await getOptimizedWebLLMEngine();
    }
    return this.engine;
  }
  
  async chatCompletion(request: ChatCompletionRequest) {
    const engine = await this.initialize();
    
    console.log('[web-llm] Processing chat completion...');
    const response = await engine.chat.completions.create(request);
    
    return response;
  }
  
  async streamChatCompletion(
    request: ChatCompletionRequest,
    onChunk?: (chunk: string) => void
  ) {
    const engine = await this.initialize();
    
    console.log('[web-llm] Starting streaming chat completion...');
    const stream = await engine.chat.completions.create({
      ...request,
      stream: true
    });
    
    let fullResponse = '';
    
    // Handle streaming response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk?.(content);
      }
    }
    
    return fullResponse;
  }
  
  async dispose() {
    if (this.engine) {
      // Note: web-llm doesn't have explicit dispose method
      // Engine cleanup is handled by the library
      this.engine = null;
    }
    webLLMEngine = null;
    enginePromise = null;
  }
}

// Performance monitoring wrapper
export const monitorWebLLMPerformance = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  try {
    const result = await fn();
    
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    console.log(`[web-llm Performance] ${operation}:`, {
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      memoryDelta: `${((endMemory - startMemory) / 1024 / 1024).toFixed(2)}MB`
    });
    
    return result;
    
  } catch (error) {
    console.error(`[web-llm Performance] ${operation} failed:`, error);
    throw error;
  }
};

// Export optimized web-llm interface
export { optimizedModelConfigs };