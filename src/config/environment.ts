/**
 * Environment Configuration for ML Platform
 * 
 * This module provides a centralized configuration system that:
 * - Uses environment variables with sensible fallbacks
 * - Provides type-safe configuration access
 * - Optimizes settings based on production/development mode
 * - Handles API endpoint configuration
 */

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const nodeEnv = import.meta.env.NODE_ENV || 'development';

// API Configuration
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true' || isDevelopment,
} as const;

// Feature Flags
export const features = {
  enableChat: import.meta.env.VITE_ENABLE_CHAT !== 'false',
  enableFeedback: import.meta.env.VITE_ENABLE_FEEDBACK !== 'false',
  enableFileUpload: import.meta.env.VITE_ENABLE_FILE_UPLOAD !== 'false',
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '104857600'), // 100MB
  maxMemoryWarning: parseInt(import.meta.env.VITE_MAX_MEMORY_WARNING || '52428800'), // 50MB
} as const;

// Performance Configuration
export const performance = {
  enableVirtualization: import.meta.env.VITE_ENABLE_VIRTUALIZATION !== 'false',
  paginationSize: parseInt(import.meta.env.VITE_PAGINATION_SIZE || '50'),
  debounceDelay: parseInt(import.meta.env.VITE_DEBOUNCE_DELAY || (isProduction ? '300' : '100')),
  chunkSize: isProduction ? 1000 : 500,
} as const;

// Security Configuration
export const security = {
  enableCSP: import.meta.env.VITE_ENABLE_CSP === 'true' && isProduction,
  enableCORSProtection: import.meta.env.VITE_ENABLE_CORS_PROTECTION === 'true' && isProduction,
} as const;

// Logging Configuration
export const logging = {
  level: (import.meta.env.VITE_LOG_LEVEL || (isProduction ? 'warn' : 'debug')) as 'debug' | 'info' | 'warn' | 'error' | 'silent',
  enableConsole: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true' || isDevelopment,
  enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true' && isProduction,
} as const;

// API Endpoints
export const endpoints = {
  ml: {
    testOpenai: `${apiConfig.baseUrl}/ml/test-openai`,
    generateData: `${apiConfig.baseUrl}/ml/generate-data`,
    trainModel: `${apiConfig.baseUrl}/ml/train-model`,
    chat: `${apiConfig.baseUrl}/ml/chat`,
  },
  feedback: {
    submit: `${apiConfig.baseUrl}/feedback`,
    list: `${apiConfig.baseUrl}/feedback`,
    stats: `${apiConfig.baseUrl}/feedback/stats`,
  }
} as const;

// Build Information
export const buildInfo = {
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
  gitCommit: import.meta.env.VITE_GIT_COMMIT || 'unknown',
} as const;

// Export all configurations
export const config = {
  isDevelopment,
  isProduction,
  nodeEnv,
  api: apiConfig,
  features,
  performance,
  security,
  logging,
  endpoints,
  buildInfo,
} as const;

export default config;

/**
 * Type-safe environment variable access
 */
export function getEnvVar(key: string, fallback: string = ''): string {
  return import.meta.env[key] || fallback;
}

/**
 * Get environment-specific configuration
 */
export function getEnvConfig<T>(prodConfig: T, devConfig: T): T {
  return isProduction ? prodConfig : devConfig;
}

/**
 * Debug helper for development
 */
export function debugLog(message: string, data?: any): void {
  if (isDevelopment && logging.enableConsole) {
    console.log(`[ML-Platform Debug] ${message}`, data);
  }
}