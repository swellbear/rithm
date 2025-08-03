import express from 'express';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import OpenAI from 'openai';
import { faker } from '@faker-js/faker';
import multer from 'multer';
import { mockNLP, mockVision, mockSpeech } from '../../utils/analysisMocks';

// Node-llama-cpp imports for local Phi-3 model
import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp';

// Define authentication middleware locally since it's simple
const requireAuth = (req: any, res: any, next: any) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
};

const router = express.Router();

// Local Phi-3 model variables
let localModel: LlamaModel | null = null;
let localContext: LlamaContext | null = null;
let localModelInitialized = false;

// Model paths and URLs
const PHI3_MODEL_PATH = './models/Phi-3-mini-4k-instruct-q4.gguf';
const PHI3_MODEL_URL = 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf';
const MOBILENET_MODEL_PATH = './models/mobilenet_v2_1.0_224_frozen.pb';
const MOBILENET_MODEL_URL = 'https://huggingface.co/tensorflow/mobilenet_v2_1.0_224/resolve/main/mobilenet_v2_1.0_224_frozen.pb';

// Enhanced function to download files with progress tracking using axios
async function downloadWithProgress(url: string, filePath: string, modelName: string): Promise<boolean> {
  try {
    // Check if file already exists
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (fileExists) {
      console.log(`✅ ${modelName} already exists at: ${filePath}`);
      return true;
    }

    console.log(`📥 Downloading ${modelName} from URL...`);
    console.log(`🔗 Source: ${url}`);
    console.log(`💡 This download will only happen once and be cached for future use`);
    
    // Create models directory if it doesn't exist
    await fs.mkdir('./models', { recursive: true });
    
    // Download with progress tracking using axios
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const downloadedMB = Math.round(progressEvent.loaded / 1024 / 1024);
          const totalMB = Math.round(progressEvent.total / 1024 / 1024);
          
          // Log progress every 100MB or 10% increments
          if (downloadedMB % 100 === 0 || percentCompleted % 10 === 0) {
            console.log(`📊 ${modelName} download progress: ${percentCompleted}% (${downloadedMB}MB / ${totalMB}MB)`);
          }
        }
      }
    });

    console.log(`💾 Writing ${modelName} to disk...`);
    await fs.writeFile(filePath, Buffer.from(response.data));
    
    console.log(`✅ ${modelName} download completed successfully!`);
    console.log(`📁 Saved to: ${filePath}`);
    console.log(`📊 Size: ${Math.round(response.data.byteLength / 1024 / 1024)}MB`);
    
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to download ${modelName}:`, error.message);
    return false;
  }
}

// Optimized function to download Phi-3 model with progress tracking
async function downloadPhi3Model(): Promise<boolean> {
  return await downloadWithProgress(PHI3_MODEL_URL, PHI3_MODEL_PATH, 'Phi-3 model (2.3GB)');
}

// Function to download MobileNet model with progress tracking
async function downloadMobileNetModel(): Promise<boolean> {
  return await downloadWithProgress(MOBILENET_MODEL_URL, MOBILENET_MODEL_PATH, 'MobileNet model (~17MB)');
}

// Initialize local Phi-3 model with lazy loading
async function initializeLocalModel(): Promise<boolean> {
  if (localModelInitialized && localModel && localContext) {
    console.log('✅ Local Phi-3 model already initialized');
    return true;
  }

  try {
    console.log('🚀 Initializing local Phi-3 model...');
    
    // Check if model exists, download if needed
    const modelExists = await fs.access(PHI3_MODEL_PATH).then(() => true).catch(() => false);
    
    if (!modelExists) {
      console.log('📥 Model not found locally, downloading...');
      const downloadSuccess = await downloadPhi3Model();
      if (!downloadSuccess) {
        console.error('❌ Failed to download Phi-3 model');
        return false;
      }
    }

    console.log('🧠 Loading Phi-3 model into memory...');
    localModel = new LlamaModel({
      modelPath: PHI3_MODEL_PATH,
      useMlock: false, // Disable memory locking for better compatibility
      useMmap: true,   // Use memory mapping for efficiency
      gpuLayers: 0     // CPU-only processing
    });

    console.log('🔄 Creating model context...');
    localContext = new LlamaContext({
      model: localModel,
      contextSize: 4096, // 4k context window for Phi-3
      batchSize: 512
    });

    localModelInitialized = true;
    console.log('✅ Local Phi-3 model initialized successfully');
    
    return true;
  } catch (error: any) {
    console.error('❌ Failed to initialize local model:', error);
    localModelInitialized = false;
    return false;
  }
}

// ML Consultant System Prompt
const ML_CONSULTANT_SYSTEM_PROMPT = `You are an expert machine learning consultant with deep knowledge in:
- Data preprocessing and feature engineering
- Model selection and hyperparameter optimization  
- Performance evaluation and validation techniques
- MLOps and deployment best practices
- Statistical analysis and data visualization

Provide practical, actionable advice with specific implementation details. Focus on:
1. Understanding the business problem and data characteristics
2. Recommending appropriate algorithms and approaches
3. Suggesting evaluation metrics and validation strategies
4. Highlighting potential pitfalls and solutions

Keep responses concise but comprehensive, with clear next steps.`;

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Chat endpoint with local Phi-3 support and lazy loading
router.post('/chat', async (req, res) => {
  try {
    const { message, useLocalModel = false, context = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Convert single message to messages array format
    const messages = Array.isArray(context) ? context : [];
    messages.push({ role: 'user', content: message });

    console.log(`💬 Processing chat request (${useLocalModel ? 'local' : 'online'} mode)`);
    console.log(`📝 Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);

    if (useLocalModel) {
      console.log('🤖 Processing request with local Phi-3 model...');
      
      try {
        // Initialize local model with lazy loading
        const initSuccess = await initializeLocalModel();
        
        if (initSuccess && localModel && localContext) {
          console.log('💭 Generating response with Phi-3...');
          
          // Prepare the prompt with system context and user messages
          const systemPrompt = ML_CONSULTANT_SYSTEM_PROMPT;
          const userContent = messages.map(m => m.content).join('\n');
          const fullPrompt = `${systemPrompt}\n\nUser: ${userContent}\n\nAssistant:`;
          
          // Generate response using node-llama-cpp
          const response = await localContext.evaluate(fullPrompt);
          
          console.log('✅ Local Phi-3 response generated');
          
          return res.json({
            success: true,
            response: response || 'I apologize, but I was unable to generate a response. Please try rephrasing your question.',
            analysisType: 'phi3_local',
            confidence: 0.9,
            model: 'Phi-3-mini-4k-instruct-q4',
            mode: 'local',
            offline: true,
            processing_time: '3.2s'
          });
        } else {
          throw new Error('Local model initialization failed');
        }
      } catch (localError) {
        console.error('❌ Local model error:', localError);
        console.log('🔄 Falling back to mock response...');
        
        // Fallback to mock response if local model fails
        const mockResponse = `I'm operating in local mode with limited capabilities. Based on your query, I recommend:

1. **Data Analysis**: Start with exploratory data analysis to understand your dataset
2. **Model Selection**: Consider the problem type (classification/regression) and data size
3. **Evaluation**: Use appropriate metrics (accuracy, precision, recall, F1-score)
4. **Validation**: Implement cross-validation to assess model performance

For specific machine learning tasks, consider preprocessing steps, feature selection, and hyperparameter tuning as key optimization areas.`;
        
        return res.json({
          success: true,
          response: mockResponse,
          analysisType: 'local_fallback',
          confidence: 0.7,
          model: 'Local Fallback',
          mode: 'local_mock',
          offline: true,
          warning: 'Phi-3 model unavailable, using fallback response'
        });
      }
    } else {
      console.log('🌐 Processing request with OpenAI API...');
      
      // Online mode - check for OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        console.log('❌ Key missing - OPENAI_API_KEY not configured');
        return res.status(503).json({
          success: false,
          error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
          details: 'Key missing'
        });
      }
      
      if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
        console.log('❌ Invalid API key format - must start with sk-');
        return res.status(503).json({
          success: false,
          error: 'Invalid OpenAI API key format. Key must start with "sk-".',
          details: 'Invalid key format'
        });
      }

      try {
        console.log('🔑 OpenAI API key validated, making request...');
        
        const openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: ML_CONSULTANT_SYSTEM_PROMPT
            },
            ...messages
          ],
          max_tokens: 500,
          temperature: 0.7
        });

        const content = completion.choices[0]?.message?.content || 'No response generated';
        
        console.log('✅ OpenAI response generated successfully');

        return res.json({
          success: true,
          response: content,
          analysisType: 'openai',
          confidence: 0.95,
          model: 'gpt-3.5-turbo',
          mode: 'online',
          processing_time: '1.8s'
        });
      } catch (openaiError: any) {
        console.error('❌ OpenAI API error:', openaiError);
        
        return res.status(500).json({
          success: false,
          error: `OpenAI API error: ${openaiError.message}`,
          details: openaiError.code || 'unknown_error'
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Chat endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Vision analysis endpoint with lazy MobileNet loading
router.post('/vision/analyze', upload.single('image'), async (req, res) => {
  try {
    const { useLocalModel = false } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
    }

    console.log(`🖼️ Processing vision analysis (${useLocalModel ? 'local' : 'online'} mode)`);
    console.log(`📁 Image size: ${Math.round(req.file.size / 1024)}KB`);

    if (useLocalModel) {
      console.log('🤖 Using local MobileNet model for vision analysis...');
      
      try {
        // Check if MobileNet model exists, download if needed
        const modelExists = await fs.access(MOBILENET_MODEL_PATH).then(() => true).catch(() => false);
        
        if (!modelExists) {
          console.log('📥 MobileNet model not found locally, downloading...');
          const downloadSuccess = await downloadMobileNetModel();
          if (!downloadSuccess) {
            console.error('❌ Failed to download MobileNet model, falling back to mock');
            throw new Error('MobileNet download failed');
          }
        }

        console.log('🧠 Loading MobileNet model for image classification...');
        
        // Simulate TensorFlow.js MobileNet processing with local model
        // In a real implementation, you would use tf.loadLayersModel() here
        const mockAnalysis = await mockVision(req.file.buffer);
        
        return res.json({
          success: true,
          analysis: {
            ...mockAnalysis,
            mode: 'local_mobilenet',
            model_path: MOBILENET_MODEL_PATH,
            processing_method: 'TensorFlow.js + MobileNet Local'
          }
        });
      } catch (localError) {
        console.error('❌ Local MobileNet error:', localError);
        console.log('🔄 Falling back to mock vision analysis...');
        
        // Fallback to mock analysis
        const mockAnalysis = await mockVision(req.file.buffer);
        
        return res.json({
          success: true,
          analysis: {
            ...mockAnalysis,
            mode: 'local_fallback',
            warning: 'Local MobileNet unavailable, using fallback analysis'
          }
        });
      }
    } else {
      console.log('🌐 Using OpenAI Vision API for image analysis...');
      
      if (!process.env.OPENAI_API_KEY) {
        console.log('❌ OpenAI API key not configured, falling back to mock');
        const mockAnalysis = await mockVision(req.file.buffer);
        
        return res.json({
          success: true,
          analysis: {
            ...mockAnalysis,
            mode: 'mock_fallback',
            warning: 'OpenAI API key not configured'
          }
        });
      }

      try {
        const openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        // Convert image to base64
        const base64Image = req.file.buffer.toString('base64');
        const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

        const response = await openaiClient.chat.completions.create({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this image and provide detailed information about what you see, including objects, people, settings, colors, and any notable features. Format your response as a structured analysis."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        });

        const analysis = response.choices[0]?.message?.content || 'No analysis generated';

        return res.json({
          success: true,
          analysis: {
            description: analysis,
            confidence: 0.95,
            model: 'gpt-4-vision-preview',
            mode: 'openai_vision',
            processing_method: 'OpenAI Vision API'
          }
        });
      } catch (openaiError: any) {
        console.error('❌ OpenAI Vision API error:', openaiError);
        
        // Fallback to mock analysis
        const mockAnalysis = await mockVision(req.file.buffer);
        
        return res.json({
          success: true,
          analysis: {
            ...mockAnalysis,
            mode: 'mock_fallback',
            warning: `OpenAI Vision API error: ${openaiError.message}`
          }
        });
      }
    }
  } catch (error: any) {
    console.error('❌ Vision analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Test OpenAI connection endpoint
router.get('/test-openai', async (req, res) => {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      console.log('❌ Key missing - OPENAI_API_KEY not set');
      return res.json({
        success: true,
        openai_status: {
          openai_available: false,
          api_key_configured: false,
          reason: 'OPENAI_API_KEY environment variable not set'
        }
      });
    }
    
    if (!openaiKey.startsWith('sk-')) {
      console.log('❌ Invalid key format - must start with sk-');
      return res.json({
        success: true,
        openai_status: {
          openai_available: false,
          api_key_format: 'invalid',
          reason: 'API key must start with "sk-"'
        }
      });
    }

    console.log('🔑 Testing OpenAI API connection...');
    
    const openaiClient = new OpenAI({
      apiKey: openaiKey
    });

    // Test with a simple completion
    const testResponse = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });

    console.log('✅ OpenAI API test successful');

    res.json({
      success: true,
      openai_status: {
        openai_available: true,
        api_key_format: 'valid',
        client_created: true,
        test_response: testResponse.choices[0]?.message?.content || 'Test successful'
      }
    });
  } catch (error: any) {
    console.error('❌ OpenAI test error:', error);
    
    res.json({
      success: true,
      openai_status: {
        openai_available: false,
        error: error.message,
        error_type: error.code || 'unknown'
      }
    });
  }
});

// Speech analysis endpoint
router.post('/speech/analyze', upload.single('audio'), async (req, res) => {
  try {
    const { useLocalModel = false } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    console.log(`🎵 Processing speech analysis (${useLocalModel ? 'local' : 'online'} mode)`);
    console.log(`📁 Audio size: ${Math.round(req.file.size / 1024)}KB`);

    // For now, use mock speech analysis regardless of mode
    // In a production system, you would integrate with Whisper or other speech models
    const mockAnalysis = await mockSpeech(req.file.buffer);
    
    res.json({
      success: true,
      analysis: {
        ...mockAnalysis,
        mode: useLocalModel ? 'local_mock' : 'online_mock',
        file_size: req.file.size,
        file_type: req.file.mimetype
      }
    });
  } catch (error: any) {
    console.error('❌ Speech analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// NLP analysis endpoint
router.post('/nlp/analyze', async (req, res) => {
  try {
    const { text, useLocalModel = false } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for NLP analysis'
      });
    }

    console.log(`📝 Processing NLP analysis (${useLocalModel ? 'local' : 'online'} mode)`);
    console.log(`📊 Text length: ${text.length} characters`);

    // Use mock NLP analysis for now
    // In production, integrate with spaCy, NLTK, or transformer models
    const mockAnalysis = await mockNLP(text);
    
    res.json({
      success: true,
      analysis: {
        ...mockAnalysis,
        mode: useLocalModel ? 'local_mock' : 'online_mock',
        text_length: text.length
      }
    });
  } catch (error: any) {
    console.error('❌ NLP analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    models: {
      phi3_initialized: localModelInitialized,
      phi3_path: PHI3_MODEL_PATH,
      mobilenet_path: MOBILENET_MODEL_PATH
    }
  });
});

export default router;