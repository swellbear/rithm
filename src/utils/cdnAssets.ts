// CDN-based asset loading for production deployments
// Reduces Docker image size by loading large WASM files from CDN

const CDN_BASE_URL = 'https://cdn.jsdelivr.net/npm/@microsoft/onnxruntime-web@1.18.0/dist/';

export const loadWASMFromCDN = async () => {
  const wasmFiles = [
    'ort-wasm-simd-threaded.jsep.wasm',
    'ort-wasm-simd.jsep.wasm',
    'ort-wasm.wasm'
  ];

  const loadPromises = wasmFiles.map(async (filename) => {
    try {
      const response = await fetch(`${CDN_BASE_URL}${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename} from CDN`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return { filename, buffer: arrayBuffer };
    } catch (error) {
      console.warn(`Failed to load ${filename} from CDN:`, error);
      return null;
    }
  });

  const results = await Promise.allSettled(loadPromises);
  const loadedAssets = results
    .filter((result): result is PromiseFulfilledResult<{ filename: string; buffer: ArrayBuffer } | null> => 
      result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value);

  return loadedAssets;
};

export const setupCDNWASMLoader = () => {
  // Configure ONNX Runtime to use CDN-loaded WASM files
  if (typeof window !== 'undefined' && (window as any).ort) {
    (window as any).ort.env.wasm.wasmPaths = CDN_BASE_URL;
  }
};