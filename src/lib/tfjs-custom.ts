// Custom TensorFlow.js setup for minimal bundle size
import * as tf from '@tensorflow/tfjs';

// Performance profiling helper
export const profileTensorFlowOperation = async <T>(
  name: string, 
  operation: () => Promise<T> | T
): Promise<T> => {
  const info = await tf.profile(async () => {
    const result = typeof operation === 'function' ? await operation() : operation;
    return result as tf.TensorContainer;
  });
  
  console.log(`[TensorFlow.js Profile] ${name}:`, {
    newBytes: info.newBytes,
    newTensors: info.newTensors,
    peakBytes: info.peakBytes,
    kernelNames: info.kernelNames,
    kernels: info.kernels.map(k => ({
      name: k.name,
      totalBytesSnapshot: k.totalBytesSnapshot,
      totalTimeMs: k.kernelTimeMs
    }))
  });
  
  return info.result as T;
};

// Optimized tensor memory management
export const optimizedImagePreprocessing = async (imageElement: HTMLImageElement | HTMLCanvasElement) => {
  return profileTensorFlowOperation('Image Preprocessing', async () => {
    // Convert to tensor with memory optimization
    const tensor = tf.browser.fromPixels(imageElement, 3)
      .resizeNearestNeighbor([224, 224])
      .expandDims(0)
      .div(255.0);
    
    return tensor;
  });
};

// Custom MobileNet wrapper with profiling
export class OptimizedMobileNet {
  private model: tf.GraphModel | null = null;
  
  async load() {
    if (this.model) return this.model;
    
    this.model = await profileTensorFlowOperation('MobileNet Load', async () => {
      return await tf.loadGraphModel('https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/4', {
        fromTFHub: true
      });
    });
    
    return this.model;
  }
  
  async predict(imageElement: HTMLImageElement | HTMLCanvasElement) {
    const model = await this.load();
    const preprocessed = await optimizedImagePreprocessing(imageElement);
    
    const prediction = await profileTensorFlowOperation('MobileNet Prediction', async () => {
      return model.predict(preprocessed) as tf.Tensor;
    });
    
    // Clean up memory
    preprocessed.dispose();
    
    return prediction;
  }
  
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

// Export optimized TensorFlow setup
export { tf };
export default tf;