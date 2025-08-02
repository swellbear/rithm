// Shared types for MLPlatform components

export interface MLData {
  [key: string]: any[];
}

export interface TrainingResults {
  model_type: string;
  best_model_type?: string;
  r2_score: number;
  mse: number;
  n_features: number;
  n_samples: number;
  test_size: number;
  additional_metrics?: {
    mae?: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    feature_importance?: { [key: string]: number };
  };
  bias_metrics?: {
    [key: string]: any;
    bias_analysis?: string;
    sensitive_feature_used?: string;
    sensitive_feature_values?: string[];
  };
}

// NEW: Report Section for editable structure
export interface ReportSection {
  type: 'heading' | 'paragraph' | 'chart' | 'table' | 'list' | 'image';
  content: string | any[]; // Text, data array, etc.
  title?: string;
  id: string; // For editing reference
  // Additional properties for different section types
  items?: any[]; // For list sections
  chartData?: any[]; // For chart sections
  chartTitle?: string; // For chart sections
  chartType?: string; // For chart sections
  chartConfig?: any; // For chart sections
  tableData?: any[][]; // For table sections
  tableTitle?: string; // For table sections
  tableHeaders?: string[]; // For table sections
}

// NEW: Report Structure for conversational edits
export interface ReportStructure {
  title: string;
  sections: ReportSection[];
  metadata: { created: string; version: number; author: string };
}

// NEW: NLP Results for Watson NLP equiv
export interface NLPResults {
  sentiment: 'positive' | 'negative' | 'neutral';
  entities: { text: string; type: string; confidence: number }[];
  keyPhrases: string[];
  language: string;
}

// NEW: Vision Results for Watson Visual Recognition equiv
export interface VisionResults {
  classifications: { label: string; score: number }[];
  objects: { label: string; score: number; location: { x: number; y: number; w: number; h: number } }[];
  ocrText?: string;
  faces?: { age: number; gender: string; emotion: string }[];
  imageUrl?: string; // For image preview and download
}

// NEW: Speech Results for Watson Speech equiv
export interface SpeechResults {
  transcript: string;
  confidence: number;
  words: { word: string; start: number; end: number; confidence: number }[];
  speakerLabels?: { speaker: number; from: number; to: number }[];
}

// NEW: Governance Metrics for watsonx.governance equiv
export interface GovernanceMetrics {
  biasDetection: { metric: string; value: number; threshold: number }[];
  fairnessScore: number;
  driftDetection: { detected: boolean; severity: 'low' | 'medium' | 'high' };
  explanations: { feature: string; impact: number; description: string }[];
}

// NEW: Deployed Model Info
export interface DeployedModel {
  id: string;
  format: 'onnx' | 'pmml' | 'pickle';
  endpoint?: string;
  metrics: { latency: number; throughput: number };
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  positive: boolean;
  impact_description?: string;
}

export interface ExplanationData {
  prediction: number | string;
  confidence: number;
  feature_importances: FeatureImportance[];
  explanation_text: string;
  model_type: string;
}

export interface OpenAIStatus {
  openai_available: boolean;
  api_key_format: string;
  client_created?: boolean;
  client_error?: string;
}

export interface Project {
  id: string;
  name: string;
  data: MLData | null;
  domain: string;
  sampleSize: number;
  modelType: string;
  trainingResults: TrainingResults | null;
  goalDescription: string;
  goalAnalysis: any;
  messages: { role: 'user' | 'assistant'; content: string }[];
  useFaker: boolean;
  customParams: any;
  uploadedFileName: string;
  reportFormat: 'word' | 'ppt';
  useLocalModel: boolean;
  // NEW: Include report structure in projects
  reportStructure?: ReportStructure;
  // NEW: Add new results to projects
  nlpResults?: NLPResults;
  visionResults?: VisionResults;
  speechResults?: SpeechResults;
  governanceMetrics?: GovernanceMetrics;
  deployedModel?: DeployedModel;
}

export interface PreviewDialog {
  open: boolean;
  blob: Blob | null;
  format: 'word' | 'ppt';
  filename: string;
}

export interface ZipContents {
  files: {filename: string, data: Uint8Array, size: number}[];
  selectedFiles: string[];
  open: boolean;
}



// Complete list of 14 ML algorithms supported by the backend with detailed descriptions
export const modelDescriptions: { [key: string]: { 
  name: string;
  description: string;
  bestFor: string[];
  whenToUse: string;
  pros: string[];
  cons: string[];
  dataRequirements: string;
  complexity: 'Low' | 'Medium' | 'High';
}} = {
  linear_regression: {
    name: 'Linear Regression',
    description: 'Linear regression models the relationship between a dependent variable and independent variables using a linear equation. It finds the best-fit line through data points to predict continuous values.',
    bestFor: ['Continuous value prediction', 'Price forecasting', 'Sales prediction', 'Risk assessment'],
    whenToUse: 'When you have numerical target values and expect linear relationships between features and target. Great for baseline models and interpretable results.',
    pros: ['Fast training and prediction', 'Highly interpretable coefficients', 'No hyperparameter tuning needed', 'Works well with small datasets'],
    cons: ['Assumes linear relationships', 'Sensitive to outliers', 'Limited complexity handling', 'May underfit complex data'],
    dataRequirements: '100+ samples recommended. Numerical features work best. Requires minimal preprocessing.',
    complexity: 'Low'
  },
  logistic_regression: {
    name: 'Logistic Regression',
    description: 'Logistic regression uses the logistic function to model binary or multiclass classification problems. It predicts probabilities and makes classifications based on threshold values.',
    bestFor: ['Binary classification', 'Probability estimation', 'Medical diagnosis', 'Marketing response prediction'],
    whenToUse: 'When you need classification with probability estimates. Excellent when interpretability is crucial and you have linear decision boundaries.',
    pros: ['Provides probability estimates', 'No tuning of hyperparameters', 'Less prone to overfitting', 'Fast training and prediction'],
    cons: ['Assumes linear decision boundary', 'Sensitive to outliers', 'Requires large sample sizes for stable results', 'Struggles with complex relationships'],
    dataRequirements: '1000+ samples per class recommended. Works with both numerical and categorical features.',
    complexity: 'Low'
  },
  decision_tree: {
    name: 'Decision Tree',
    description: 'Decision trees create a tree-like model of decisions by splitting data based on feature values. Each internal node represents a test on a feature, and each leaf represents a classification or prediction.',
    bestFor: ['Rule extraction', 'Feature importance analysis', 'Mixed data types', 'Interpretable models'],
    whenToUse: 'When you need easily interpretable models with clear decision rules. Works well with both numerical and categorical data without preprocessing.',
    pros: ['Highly interpretable', 'Handles mixed data types', 'No assumptions about data distribution', 'Automatic feature selection'],
    cons: ['Prone to overfitting', 'Unstable (small data changes affect tree)', 'Biased toward features with many levels', 'Poor with linear relationships'],
    dataRequirements: '500+ samples recommended. Works with any data type. No preprocessing needed.',
    complexity: 'Low'
  },
  random_forest: {
    name: 'Random Forest',
    description: 'Random Forest combines multiple decision trees using bootstrap aggregating (bagging). Each tree votes on the final prediction, reducing overfitting and improving generalization.',
    bestFor: ['General-purpose classification/regression', 'Feature importance ranking', 'Handling missing values', 'Mixed data types'],
    whenToUse: 'Excellent all-around algorithm when you want good performance with minimal tuning. Great for exploratory analysis and when you have mixed data types.',
    pros: ['Reduces overfitting', 'Handles missing values', 'Provides feature importance', 'Works with mixed data types'],
    cons: ['Less interpretable than single tree', 'Can overfit with very noisy data', 'Memory intensive', 'Slower prediction than single tree'],
    dataRequirements: '1000+ samples recommended. Handles missing values automatically. No preprocessing needed.',
    complexity: 'Medium'
  },
  gradient_boosting: {
    name: 'Gradient Boosting',
    description: 'Gradient boosting builds models sequentially, where each new model corrects errors made by previous models. It uses gradient descent to minimize prediction errors.',
    bestFor: ['High-accuracy predictions', 'Competitions', 'Complex pattern recognition', 'Feature interactions'],
    whenToUse: 'When you prioritize prediction accuracy and have sufficient data. Excellent for capturing complex patterns and feature interactions.',
    pros: ['High predictive accuracy', 'Handles feature interactions well', 'No need for data preprocessing', 'Built-in feature importance'],
    cons: ['Prone to overfitting', 'Requires hyperparameter tuning', 'Slower training', 'Less interpretable'],
    dataRequirements: '1000+ samples recommended. Benefits from larger datasets. Handles mixed data types.',
    complexity: 'High'
  },
  xgboost: {
    name: 'XGBoost',
    description: 'Extreme Gradient Boosting is an optimized gradient boosting framework designed for speed and performance. It uses advanced regularization and parallel processing.',
    bestFor: ['Competition-level accuracy', 'Large datasets', 'Complex problems', 'Feature engineering'],
    whenToUse: 'When you need state-of-the-art performance and have resources for hyperparameter tuning. Popular choice for Kaggle competitions and production systems.',
    pros: ['Excellent performance', 'Built-in regularization', 'Handles missing values', 'Parallel processing support'],
    cons: ['Requires extensive tuning', 'Can be complex to optimize', 'Memory intensive', 'Risk of overfitting'],
    dataRequirements: '2000+ samples recommended. Excels with large datasets. Automatic handling of missing values.',
    complexity: 'High'
  },
  lightgbm: {
    name: 'LightGBM',
    description: 'Light Gradient Boosting Machine uses leaf-wise tree growth instead of level-wise, making it faster and more memory efficient than traditional gradient boosting.',
    bestFor: ['Large datasets', 'Fast training', 'Memory efficiency', 'High-dimensional data'],
    whenToUse: 'When working with large datasets and need faster training than XGBoost. Excellent for datasets with many features or samples.',
    pros: ['Very fast training', 'Memory efficient', 'High accuracy', 'Handles categorical features natively'],
    cons: ['Can overfit small datasets', 'Requires careful tuning', 'Sensitive to overfitting', 'Complex parameter space'],
    dataRequirements: '10000+ samples recommended. Designed for large datasets. Handles categorical features directly.',
    complexity: 'High'
  },
  catboost: {
    name: 'CatBoost',
    description: 'Categorical Boosting is a gradient boosting algorithm that handles categorical features automatically without preprocessing. It uses ordered boosting to reduce overfitting.',
    bestFor: ['Categorical features', 'Mixed data types', 'Robust predictions', 'Minimal preprocessing'],
    whenToUse: 'When your dataset has many categorical features and you want to avoid manual encoding. Great for datasets with mixed data types.',
    pros: ['No preprocessing needed', 'Handles categorical features naturally', 'Robust to overfitting', 'Good default parameters'],
    cons: ['Slower than LightGBM', 'Less established than XGBoost', 'Can be memory intensive', 'Limited interpretability'],
    dataRequirements: '1000+ samples recommended. Excels with categorical features. Minimal data preparation needed.',
    complexity: 'High'
  },
  support_vector_machine: {
    name: 'Support Vector Machine',
    description: 'SVM finds the optimal hyperplane that separates classes with maximum margin. It can use kernel tricks to handle non-linear relationships.',
    bestFor: ['Text classification', 'Image classification', 'High-dimensional data', 'Non-linear patterns'],
    whenToUse: 'When you have high-dimensional data or need to capture complex non-linear relationships. Excellent for text and image data.',
    pros: ['Works well in high dimensions', 'Memory efficient', 'Versatile with kernel tricks', 'Effective with small datasets'],
    cons: ['Slow on large datasets', 'Sensitive to feature scaling', 'No probabilistic output', 'Difficult to interpret'],
    dataRequirements: '100-10000 samples optimal. Requires feature scaling. Works best with normalized data.',
    complexity: 'Medium'
  },
  k_nearest_neighbors: {
    name: 'K-Nearest Neighbors',
    description: 'KNN makes predictions based on the K closest data points in the feature space. It stores all training data and makes decisions based on similarity.',
    bestFor: ['Simple classification', 'Recommendation systems', 'Pattern recognition', 'Non-parametric problems'],
    whenToUse: 'When you have a relatively small dataset and local patterns are important. Good for recommendation systems and when decision boundaries are irregular.',
    pros: ['Simple to understand', 'No training period', 'Works with non-linear data', 'Can be used for both classification and regression'],
    cons: ['Computationally expensive for large datasets', 'Sensitive to irrelevant features', 'Requires feature scaling', 'Poor performance in high dimensions'],
    dataRequirements: '500-5000 samples optimal. Requires feature scaling. Performance degrades with high dimensions.',
    complexity: 'Low'
  },
  naive_bayes: {
    name: 'Naive Bayes',
    description: 'Naive Bayes applies Bayes theorem with the assumption of independence between features. Despite this "naive" assumption, it often performs well in practice.',
    bestFor: ['Text classification', 'Spam filtering', 'Sentiment analysis', 'Real-time predictions'],
    whenToUse: 'When you have limited training data or need fast predictions. Excellent for text classification and when features are approximately independent.',
    pros: ['Fast training and prediction', 'Works well with small datasets', 'Handles multiple classes naturally', 'Not sensitive to irrelevant features'],
    cons: ['Assumes feature independence', 'Can be outperformed by more sophisticated methods', 'Requires smoothing for zero probabilities', 'Poor estimator for probability'],
    dataRequirements: '100+ samples per class sufficient. Works well with small datasets. Handles categorical and continuous features.',
    complexity: 'Low'
  },
  neural_network: {
    name: 'Neural Network (MLP)',
    description: 'Multi-layer Perceptron neural network uses multiple layers of interconnected neurons to learn complex patterns. Each layer transforms the input using weighted connections.',
    bestFor: ['Complex pattern recognition', 'Non-linear relationships', 'Image processing', 'Deep learning tasks'],
    whenToUse: 'When you have large datasets and complex non-linear patterns. Good stepping stone to deep learning and when linear models fail.',
    pros: ['Can learn complex patterns', 'Universal function approximator', 'Flexible architecture', 'Works with various data types'],
    cons: ['Requires large datasets', 'Prone to overfitting', 'Difficult to interpret', 'Requires careful tuning'],
    dataRequirements: '5000+ samples recommended. Benefits from feature scaling. Requires substantial data for good performance.',
    complexity: 'High'
  },
  auto_ml: {
    name: 'AutoML',
    description: 'Automated Machine Learning tests multiple algorithms and hyperparameters automatically to find the best model for your data. It handles model selection and optimization.',
    bestFor: ['Exploratory analysis', 'Benchmark comparisons', 'Quick prototyping', 'Model selection'],
    whenToUse: 'When you want to compare multiple algorithms quickly or are unsure which model to use. Great for getting baseline performance across different approaches.',
    pros: ['Tests multiple algorithms', 'Automatic hyperparameter tuning', 'Good for beginners', 'Provides model comparisons'],
    cons: ['Longer training time', 'Less control over process', 'May not find optimal solution', 'Resource intensive'],
    dataRequirements: '1000+ samples recommended. Works with any data type. Benefits from larger datasets for better comparisons.',
    complexity: 'Medium'
  },
  k_means: {
    name: 'K-Means Clustering',
    description: 'K-Means partitions data into K clusters by minimizing within-cluster variance. It assigns each point to the nearest cluster centroid.',
    bestFor: ['Customer segmentation', 'Market research', 'Data exploration', 'Dimensionality reduction preprocessing'],
    whenToUse: 'When you want to discover hidden patterns or group similar data points. Excellent for customer segmentation and exploratory data analysis.',
    pros: ['Simple to understand', 'Fast computation', 'Works well with spherical clusters', 'Scales well to large datasets'],
    cons: ['Need to specify K in advance', 'Sensitive to initialization', 'Assumes spherical clusters', 'Sensitive to outliers'],
    dataRequirements: '100+ samples recommended. Works best with numerical features. Requires feature scaling.',
    complexity: 'Low'
  }
};

// Ensure we have exactly 14 models
export const MODEL_TYPES = Object.keys(modelDescriptions);
console.assert(MODEL_TYPES.length === 14, `Expected 14 models, got ${MODEL_TYPES.length}`);