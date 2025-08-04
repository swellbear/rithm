// Unified ML integration layer using lazy loading for bundle optimization
import { loadTensorFlow, loadTransformers, loadWebLLM, loadONNX } from './lazy-ml-loader';

// Centralized ML service manager with lazy loading
export class MLServiceManager {
  private tensorflowService: any = null;
  private nlpService: any = null;
  private visionService: any = null;
  private llmService: any = null;
  
  // Lazy initialization - services loaded only when needed
  private async getTensorFlowService() {
    if (!this.tensorflowService) {
      const tf = await loadTensorFlow();
      this.tensorflowService = new tf.OptimizedMobileNet();
    }
    return this.tensorflowService;
  }

  private async getNLPService() {
    if (!this.nlpService) {
      const transformers = await loadTransformers();
      this.nlpService = new transformers.OptimizedNLPProcessor();
    }
    return this.nlpService;
  }

  private async getVisionService() {
    if (!this.visionService) {
      const transformers = await loadTransformers();
      this.visionService = new transformers.OptimizedVisionProcessor();
    }
    return this.visionService;
  }

  private async getLLMService() {
    if (!this.llmService) {
      const webllm = await loadWebLLM();
      this.llmService = new webllm.OptimizedWebLLMChat();
    }
    return this.llmService;
  }
  
  // TensorFlow.js operations with profiling (lazy loaded)
  async classifyImageWithTensorFlow(imageElement: HTMLImageElement | HTMLCanvasElement) {
    const tf = await loadTensorFlow();
    const service = await this.getTensorFlowService();
    
    return await tf.profileTensorFlowOperation('Image Classification', async () => {
      return await service.predict(imageElement);
    });
  }
  
  // NLP operations with optimized transformers (lazy loaded)
  async analyzeSentiment(text: string) {
    console.log('[ML Integration] Loading NLP service...');
    const service = await this.getNLPService();
    console.log('[ML Integration] Processing sentiment analysis...');
    return await service.analyzeSentiment(text);
  }
  
  async classifyText(text: string, labels: string[]) {
    console.log('[ML Integration] Loading NLP service...');
    const service = await this.getNLPService();
    console.log('[ML Integration] Processing text classification...');
    return await service.classifyText(text, labels);
  }
  
  // Vision operations with optimized transformers (lazy loaded)
  async classifyImageWithTransformers(imageUrl: string) {
    console.log('[ML Integration] Loading vision service...');
    const service = await this.getVisionService();
    console.log('[ML Integration] Processing image classification...');
    return await service.classifyImage(imageUrl);
  }
  
  // LLM operations with web-llm (lazy loaded)
  async generateText(messages: any[]) {
    console.log('[ML Integration] Loading LLM service...');
    const webllm = await loadWebLLM();
    const service = await this.getLLMService();
    
    return await webllm.monitorWebLLMPerformance('Text Generation', async () => {
      return await service.chatCompletion({
        model: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      });
    });
  }

  // New ONNX operations following the suggested pattern
  async runONNXInference(modelPath: string, inputData: any) {
    console.log('[ML Integration] Loading ONNX service...');
    const { Session, createSession } = await loadONNX();
    
    try {
      // Load quantized ONNX model with optimized settings
      const session = await createSession(modelPath);
      
      // Run inference with the quantized model
      const results = await session.run(inputData);
      console.log('[ML Integration] ONNX inference completed');
      
      return results;
    } catch (error) {
      console.error('[ML Integration] ONNX inference failed:', error);
      throw error;
    }
  }

  // Memory management - clear all cached services
  clearAllCaches() {
    this.tensorflowService = null;
    this.nlpService = null;
    this.visionService = null;
    this.llmService = null;
    console.log('[ML Integration] All service caches cleared');
  }
  
  // Streaming text generation with lazy loading
  async streamText(messages: any[], onChunk?: (chunk: string) => void) {
    console.log('[ML Integration] Loading LLM service for streaming...');
    const webllm = await loadWebLLM();
    const service = await this.getLLMService();
    
    return await webllm.monitorWebLLMPerformance('Streaming Text Generation', async () => {
      return await service.streamChatCompletion({
        model: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      }, onChunk);
    });
  }
  
  // Cleanup and memory management with lazy loading safety
  async dispose() {
    console.log('[ML Integration] Cleaning up ML services...');
    try {
      if (this.tensorflowService) {
        await this.tensorflowService.dispose?.();
      }
      if (this.nlpService) {
        await this.nlpService.dispose?.();
      }
      if (this.visionService) {
        await this.visionService.dispose?.();
      }
      if (this.llmService) {
        await this.llmService.dispose?.();
      }
      this.clearAllCaches();
      console.log('[ML Integration] All services disposed successfully');
    } catch (error) {
      console.error('[ML Integration] Error during disposal:', error);
    }
  }
  
  // Performance monitoring
  getPerformanceMetrics() {
    return {
      timestamp: Date.now(),
      memory: (performance as any).memory?.usedJSHeapSize || 0,
      services: {
        tensorflow: !!this.tensorflowService,
        nlp: !!this.nlpService,
        vision: !!this.visionService,
        llm: !!this.llmService
      }
    };
  }
}

// Singleton instance for global use
export const mlServices = new MLServiceManager();

// Hook for React components
export const useMLServices = () => {
  return {
    services: mlServices,
    classifyImage: mlServices.classifyImageWithTensorFlow.bind(mlServices),
    analyzeSentiment: mlServices.analyzeSentiment.bind(mlServices),
    classifyText: mlServices.classifyText.bind(mlServices),
    generateText: mlServices.generateText.bind(mlServices),
    streamText: mlServices.streamText.bind(mlServices),
    getMetrics: mlServices.getPerformanceMetrics.bind(mlServices),
    cleanup: mlServices.dispose.bind(mlServices)
  };
};