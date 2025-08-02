import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// Standardized error response interface
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
}

// Error types for better categorization
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR"
}

// Custom error class for better error handling
export class AppError extends Error {
  public statusCode: number;
  public errorType: ErrorType;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorType: ErrorType = ErrorType.INTERNAL_ERROR,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.details = details;
    this.name = "AppError";
  }
}

// Enhanced error response formatter
export function formatErrorResponse(
  error: Error | AppError | ZodError,
  req: Request,
  statusCode?: number
): ErrorResponse {
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      error: ErrorType.VALIDATION_ERROR,
      message: "Invalid request data",
      statusCode: 400,
      timestamp,
      path,
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    };
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return {
      error: error.errorType,
      message: error.message,
      statusCode: error.statusCode,
      timestamp,
      path,
      details: error.details
    };
  }

  // Handle generic errors
  return {
    error: ErrorType.INTERNAL_ERROR,
    message: error.message || "An unexpected error occurred",
    statusCode: statusCode || 500,
    timestamp,
    path
  };
}

// Async error handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Request logger middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url, body, query } = req;
  
  console.log(`[${new Date().toISOString()}] ${method} ${url}`);
  
  if (Object.keys(query).length > 0) {
    console.log(`Query params:`, query);
  }
  
  if (method !== 'GET' && body && Object.keys(body).length > 0) {
    console.log(`Request body:`, JSON.stringify(body, null, 2));
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${res.statusCode} (${duration}ms)`);
  });

  next();
}

// Global error handler middleware
export function globalErrorHandler(
  error: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Global error handler caught:', error);
  
  const errorResponse = formatErrorResponse(error, req);
  
  // Log detailed error information
  console.error(`Error Details:`, {
    timestamp: errorResponse.timestamp,
    path: errorResponse.path,
    error: errorResponse.error,
    message: errorResponse.message,
    statusCode: errorResponse.statusCode,
    stack: error.stack,
    details: errorResponse.details
  });

  // Send error response
  res.status(errorResponse.statusCode).json(errorResponse);
}

// Database error handler
export function handleDatabaseError(error: any, operation: string): AppError {
  console.error(`Database error in ${operation}:`, error);
  
  // Handle specific database errors
  if (error.code === '23505') { // Unique constraint violation
    return new AppError(
      `Duplicate entry: ${error.detail}`,
      409,
      ErrorType.BUSINESS_LOGIC_ERROR,
      { code: error.code, constraint: error.constraint }
    );
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    return new AppError(
      `Referenced record not found: ${error.detail}`,
      400,
      ErrorType.BUSINESS_LOGIC_ERROR,
      { code: error.code, constraint: error.constraint }
    );
  }
  
  if (error.code === '23502') { // Not null constraint violation
    return new AppError(
      `Required field missing: ${error.column}`,
      400,
      ErrorType.VALIDATION_ERROR,
      { code: error.code, column: error.column }
    );
  }
  
  // Generic database error
  return new AppError(
    `Database operation failed: ${operation}`,
    500,
    ErrorType.DATABASE_ERROR,
    { originalError: error.message }
  );
}

// Authentication error handler
export function handleAuthError(message: string = "Authentication required"): AppError {
  return new AppError(
    message,
    401,
    ErrorType.AUTHENTICATION_ERROR
  );
}

// Not found error handler
export function handleNotFoundError(resource: string, id?: string | number): AppError {
  const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
  return new AppError(
    message,
    404,
    ErrorType.NOT_FOUND_ERROR
  );
}

// Business logic error handler
export function handleBusinessLogicError(message: string, details?: any): AppError {
  return new AppError(
    message,
    400,
    ErrorType.BUSINESS_LOGIC_ERROR,
    details
  );
}