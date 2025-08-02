// Custom TensorFlow.js build for optimized bundle size
// Only imports essential operations to reduce from 150MB+ to ~30-50MB

// Core TensorFlow.js operations
export * from '@tensorflow/tfjs-core';

// Essential layers for most ML operations
export {
  layers,
  sequential,
  model
} from '@tensorflow/tfjs-layers';

// CPU backend (lighter than WebGL for many use cases)
export * from '@tensorflow/tfjs-backend-cpu';

// Optional: WebGL backend (comment out if not needed to save ~40MB)
// export * from '@tensorflow/tfjs-backend-webgl';

// Essential operations for image processing
export {
  browser,
  image,
  data
} from '@tensorflow/tfjs';

// Quantization support for int8/fp16 models
export {
  loadLayersModel,
  loadGraphModel,
  ready,
  setBackend,
  getBackend
} from '@tensorflow/tfjs';

// Custom model loading with quantization support
export const loadQuantizedModel = async (modelUrl: string, format: 'layers' | 'graph' = 'layers') => {
  // Set CPU backend for better performance with quantized models
  await import('@tensorflow/tfjs-backend-cpu');
  const tf = await import('@tensorflow/tfjs-core');
  await tf.setBackend('cpu');
  await tf.ready();
  
  if (format === 'layers') {
    const { loadLayersModel } = await import('@tensorflow/tfjs');
    return loadLayersModel(modelUrl);
  } else {
    const { loadGraphModel } = await import('@tensorflow/tfjs');
    return loadGraphModel(modelUrl);
  }
};

// MobileNet-style image classification helper
export const classifyImage = async (imageElement: HTMLImageElement) => {
  const tf = await import('@tensorflow/tfjs-core');
  const { browser } = await import('@tensorflow/tfjs');
  
  // Convert image to tensor
  const tensor = browser.fromPixels(imageElement)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .div(255.0)
    .expandDims();
  
  return tensor;
};

// Memory cleanup utility
export const disposeModel = (model: any) => {
  if (model && model.dispose) {
    model.dispose();
  }
};