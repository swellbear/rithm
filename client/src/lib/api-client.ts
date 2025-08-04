/**
 * Production-Ready API Client for ML Platform
 * 
 * This module provides:
 * - Environment-aware API configuration
 * - Automatic error handling and retry logic
 * - Request/response interceptors
 * - Type-safe API calls
 * - Performance monitoring
 * - Production optimizations
 */

import { config, endpoints } from '@/config/environment';
import { apiLogger, performanceLogger } from '@/lib/logger';

// API Client Configuration
interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  headers: Record<string, string>;
}

// Request/Response Types
interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
  timestamp: string;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
  context?: any;
}

class ApiClient {
  private config: ApiClientConfig;
  private requestId: number = 0;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestId}`;
  }

  /**
   * Create standardized headers for requests
   */
  private createHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Requested-With': 'MLPlatform',
      'X-Client-Version': config.buildInfo.version,
      ...this.config.headers,
      ...customHeaders,
    };
  }

  /**
   * Enhanced fetch with timeout and retry logic
   */
  private async fetchWithRetry(request: ApiRequest, attempt: number = 1): Promise<Response> {
    const requestId = this.generateRequestId();
    const startTime = performance.now();
    
    try {
      performanceLogger.mark(`api-start-${requestId}`);
      
      // Create abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), request.timeout || this.config.timeout);
      
      // Combine signals if one is provided
      if (request.signal) {
        request.signal.addEventListener('abort', () => controller.abort());
      }

      const response = await fetch(request.url, {
        method: request.method,
        headers: this.createHeaders(request.headers),
        body: request.data ? JSON.stringify(request.data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      const duration = performance.now() - startTime;
      performanceLogger.mark(`api-end-${requestId}`);
      performanceLogger.measure(`API ${request.method} ${request.url}`, `api-start-${requestId}`, `api-end-${requestId}`);

      apiLogger.debug(`API ${request.method} ${request.url} - ${response.status} (${duration.toFixed(2)}ms)`);

      // Handle successful responses
      if (response.ok) {
        return response;
      }

      // Handle client/server errors
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error: any) {
      const duration = performance.now() - startTime;
      
      // Handle timeout
      if (error.name === 'AbortError') {
        apiLogger.warn(`API ${request.method} ${request.url} - Timeout (${duration.toFixed(2)}ms)`);
        throw this.createApiError('Request timeout', 408, 'TIMEOUT', { url: request.url, duration });
      }

      // Handle network errors
      if (!navigator.onLine) {
        apiLogger.warn(`API ${request.method} ${request.url} - Offline`);
        throw this.createApiError('Network unavailable', 0, 'OFFLINE', { url: request.url });
      }

      // Retry logic for retryable errors
      const isRetryable = this.isRetryableError(error);
      if (isRetryable && attempt < this.config.retryAttempts) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        apiLogger.info(`Retrying API ${request.method} ${request.url} in ${delay}ms (attempt ${attempt + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(request, attempt + 1);
      }

      apiLogger.error(`API ${request.method} ${request.url} - Failed after ${attempt} attempts (${duration.toFixed(2)}ms)`, error);
      throw this.createApiError(error.message, error.status, 'REQUEST_FAILED', { url: request.url, attempts: attempt });
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
    
    // Server errors (5xx)
    if (error.status >= 500) return true;
    
    // Rate limiting
    if (error.status === 429) return true;
    
    return false;
  }

  /**
   * Create standardized API error
   */
  private createApiError(message: string, status?: number, code?: string, context?: any): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.code = code;
    error.context = context;
    return error;
  }

  /**
   * Parse API response
   */
  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      return {
        success: response.ok,
        data: data.data || data,
        error: data.error,
        message: data.message,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse response',
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generic API request method
   */
  public async request<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithRetry(request);
      return await this.parseResponse<T>(response);
    } catch (error: any) {
      apiLogger.error('API request failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        status: error.status || 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Convenience methods
   */
  public async get<T = any>(url: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, headers, signal });
  }

  public async post<T = any>(url: string, data?: any, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, headers, signal });
  }

  public async put<T = any>(url: string, data?: any, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, headers, signal });
  }

  public async patch<T = any>(url: string, data?: any, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, headers, signal });
  }

  public async delete<T = any>(url: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, headers, signal });
  }
}

// Create configured API client instance
const apiClient = new ApiClient({
  baseUrl: config.api.baseUrl,
  timeout: config.api.timeout,
  retryAttempts: config.isProduction ? 3 : 1,
  retryDelay: config.isProduction ? 1000 : 500,
  headers: {
    'X-Environment': config.nodeEnv,
    'X-Build-Version': config.buildInfo.version,
  },
});

// ML Platform API Methods
export const mlApi = {
  /**
   * Test OpenAI connection
   */
  async testOpenai(signal?: AbortSignal) {
    return apiClient.get(endpoints.ml.testOpenai, {}, signal);
  },

  /**
   * Generate synthetic data
   */
  async generateData(params: {
    sampleSize: number;
    domain: string;
    columns?: string[];
  }, signal?: AbortSignal) {
    return apiClient.post(endpoints.ml.generateData, params, {}, signal);
  },

  /**
   * Train ML model
   */
  async trainModel(params: {
    data: Record<string, any>;
    model_type: string;
    target_column: string;
  }, signal?: AbortSignal) {
    return apiClient.post(endpoints.ml.trainModel, params, {}, signal);
  },

  /**
   * Send chat message
   */
  async sendChatMessage(params: {
    message: string;
    context?: any;
    attachments?: File[];
  }, signal?: AbortSignal) {
    // Handle file uploads differently
    const formData = new FormData();
    formData.append('message', params.message);
    if (params.context) {
      formData.append('context', JSON.stringify(params.context));
    }
    if (params.attachments) {
      params.attachments.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }

    return apiClient.request({
      method: 'POST',
      url: endpoints.ml.chat,
      data: formData,
      headers: {
        // Don't set Content-Type for FormData
      },
      signal,
    });
  },
};

// Feedback API Methods
export const feedbackApi = {
  /**
   * Submit feedback
   */
  async submit(feedback: any, signal?: AbortSignal) {
    return apiClient.post(endpoints.feedback.submit, feedback, {}, signal);
  },

  /**
   * Get feedback list
   */
  async list(signal?: AbortSignal) {
    return apiClient.get(endpoints.feedback.list, {}, signal);
  },

  /**
   * Get feedback statistics
   */
  async getStats(signal?: AbortSignal) {
    return apiClient.get(endpoints.feedback.stats, {}, signal);
  },
};

// Default export
export default apiClient;

// Export types
export type { ApiResponse, ApiError, ApiRequest };