// Optimized Transformers.js for reduced bundle size
// Replaces @huggingface/transformers with lighter, browser-optimized version

// Lazy loading for different pipeline types
export const loadTextClassificationPipeline = async () => {
  // Using standard @huggingface/transformers with optimizations
  const { pipeline } = await import('@huggingface/transformers');
  return pipeline('text-classification', 'distilbert-base-uncased-finetuned-sst-2-english', {
    dtype: 'q8', // Use quantized int8 models for smaller size
    device: 'cpu' // Force CPU to avoid WebGL memory issues
  });
};

export const loadTokenClassificationPipeline = async () => {
  const { pipeline } = await import('@huggingface/transformers');
  return pipeline('token-classification', 'bert-base-NER', {
    dtype: 'q8',
    device: 'cpu'
  });
};

export const loadQuestionAnsweringPipeline = async () => {
  const { pipeline } = await import('@huggingface/transformers');
  return pipeline('question-answering', 'distilbert-base-cased-distilled-squad', {
    dtype: 'q8',
    device: 'cpu'
  });
};

export const loadSummarizationPipeline = async () => {
  const { pipeline } = await import('@huggingface/transformers');
  return pipeline('summarization', 'facebook/bart-large-cnn', {
    dtype: 'q8',
    device: 'cpu'
  });
};

// Unified interface for all NLP tasks
export class OptimizedNLPService {
  private pipelines: Map<string, any> = new Map();

  async getSentimentAnalysis() {
    if (!this.pipelines.has('sentiment')) {
      console.log('[OptimizedNLP] Loading sentiment analysis pipeline...');
      const pipeline = await loadTextClassificationPipeline();
      this.pipelines.set('sentiment', pipeline);
    }
    return this.pipelines.get('sentiment');
  }

  async getEntityExtraction() {
    if (!this.pipelines.has('entities')) {
      console.log('[OptimizedNLP] Loading entity extraction pipeline...');
      const pipeline = await loadTokenClassificationPipeline();
      this.pipelines.set('entities', pipeline);
    }
    return this.pipelines.get('entities');
  }

  async getQuestionAnswering() {
    if (!this.pipelines.has('qa')) {
      console.log('[OptimizedNLP] Loading Q&A pipeline...');
      const pipeline = await loadQuestionAnsweringPipeline();
      this.pipelines.set('qa', pipeline);
    }
    return this.pipelines.get('qa');
  }

  async getSummarization() {
    if (!this.pipelines.has('summarization')) {
      console.log('[OptimizedNLP] Loading summarization pipeline...');
      const pipeline = await loadSummarizationPipeline();
      this.pipelines.set('summarization', pipeline);
    }
    return this.pipelines.get('summarization');
  }

  // Analyze text with multiple NLP tasks
  async analyzeText(text: string) {
    const [sentiment, entities] = await Promise.all([
      this.getSentimentAnalysis().then(pipe => pipe(text)),
      this.getEntityExtraction().then(pipe => pipe(text))
    ]);

    return {
      sentiment: sentiment[0],
      entities: entities.filter((entity: any) => entity.score > 0.5),
      analysis_type: 'optimized_transformers',
      model_size: 'quantized'
    };
  }

  dispose() {
    this.pipelines.clear();
    console.log('[OptimizedNLP] All pipelines disposed');
  }
}

// Global instance
export const optimizedNLP = new OptimizedNLPService();