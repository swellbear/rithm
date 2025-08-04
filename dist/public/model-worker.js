/**
 * Web Worker for Hugging Face Transformers.js model loading
 * Handles heavy ML operations in background thread to prevent UI blocking
 */

let model = null;
let textStreamer = null;

// Import transformers dynamically
importScripts('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.2/dist/transformers.min.js');

self.onmessage = async function(event) {
  const { type, payload } = event.data;
  
  try {
    switch (type) {
      case 'LOAD_MODEL':
        await loadModel();
        break;
        
      case 'GENERATE_TEXT':
        await generateText(payload);
        break;
        
      default:
        postMessage({
          type: 'ERROR',
          error: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    postMessage({
      type: 'ERROR',
      error: error.message || 'Unknown worker error'
    });
  }
};

async function loadModel() {
  try {
    postMessage({
      type: 'LOAD_PROGRESS',
      status: 'loading',
      message: 'Initializing Hugging Face transformers...'
    });
    
    // Import pipeline and TextStreamer from the global transformers
    const { pipeline, TextStreamer } = window.Transformers;
    
    postMessage({
      type: 'LOAD_PROGRESS', 
      message: 'Loading Phi-3-mini-4k-instruct model...'
    });
    
    // Load model with progress callbacks
    model = await pipeline('text-generation', 'Xenova/Phi-3-mini-4k-instruct', {
      dtype: 'q4',
      use_external_data_format: true,
      progress_callback: (data) => {
        if (data.status === 'progress') {
          postMessage({
            type: 'LOAD_PROGRESS',
            status: 'progress',
            loaded: data.loaded || 0,
            total: data.total || 1,
            message: `Loading: ${data.loaded} / ${data.total} bytes`
          });
        }
      }
    });
    
    // Create text streamer
    textStreamer = new TextStreamer(model.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true
    });
    
    postMessage({
      type: 'MODEL_LOADED',
      message: 'Model loaded successfully'
    });
    
  } catch (error) {
    postMessage({
      type: 'LOAD_ERROR',
      error: error.message
    });
  }
}

async function generateText({ messages, options = {} }) {
  if (!model) {
    throw new Error('Model not loaded');
  }
  
  try {
    postMessage({
      type: 'GENERATION_START',
      message: 'Starting text generation...'
    });
    
    const startTime = Date.now();
    
    const defaultOptions = {
      max_new_tokens: 150,
      temperature: 0.7,
      do_sample: true,
      return_full_text: false,
      streamer: textStreamer
    };
    
    const reply = await model(messages, { ...defaultOptions, ...options });
    
    const generationTime = Date.now() - startTime;
    
    postMessage({
      type: 'GENERATION_COMPLETE',
      result: reply,
      generationTime,
      message: `Generation completed in ${generationTime}ms`
    });
    
  } catch (error) {
    postMessage({
      type: 'GENERATION_ERROR',
      error: error.message
    });
  }
}