import loglevel from 'loglevel';
import { config } from '@/config/environment';

// Enhanced environment detection for production readiness
const isDev = config.isDevelopment;
const isProd = config.isProduction;
const isTest = process.env.NODE_ENV === 'test';

// Production-aware log level configuration
if (isTest) {
  loglevel.setLevel('SILENT'); // Suppress logs in tests
} else {
  // Use environment configuration with fallbacks
  const logLevels = {
    'debug': 'DEBUG',
    'info': 'INFO', 
    'warn': 'WARN',
    'error': 'ERROR',
    'silent': 'SILENT'
  } as const;
  
  const level = logLevels[config.logging.level] || (isDev ? 'DEBUG' : 'WARN');
  loglevel.setLevel(level);
}

// Production optimization: Replace console methods in production builds
if (isProd && !config.logging.enableConsole) {
  const originalFactory = loglevel.methodFactory;
  loglevel.methodFactory = (methodName, logLevel, loggerName) => {
    const rawMethod = originalFactory(methodName, logLevel, loggerName);
    
    return (...args) => {
      // Only allow critical logs in production
      if (methodName === 'error' || methodName === 'warn') {
        rawMethod(...args);
        
        // Error reporting integration point
        if (config.logging.enableErrorReporting && methodName === 'error') {
          reportError(args[0], args.slice(1));
        }
      }
      // Silently drop debug/info logs in production
    };
  };
  loglevel.setLevel(loglevel.getLevel()); // Rebuild methods
}

// Create custom logger with prefixes for different modules
export class Logger {
  private prefix: string;

  constructor(module: string) {
    this.prefix = `[${module}]`;
  }

  debug(message: string, ...args: any[]): void {
    loglevel.debug(`${this.prefix} ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    loglevel.info(`${this.prefix} ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    loglevel.warn(`${this.prefix} ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    loglevel.error(`${this.prefix} ${message}`, ...args);
  }

  // Special method for user-facing success messages (always shown)
  success(message: string, ...args: any[]): void {
    loglevel.info(`${this.prefix} ✅ ${message}`, ...args);
  }

  // Special method for user-facing progress (always shown in dev)
  progress(message: string, ...args: any[]): void {
    if (config.logging.enableConsole) {
      loglevel.info(`${this.prefix} 🔄 ${message}`, ...args);
    }
  }

  // Performance logging for production monitoring
  performance(message: string, duration?: number, ...args: any[]): void {
    if (isDev || config.logging.enableConsole) {
      const perfMsg = duration ? `${message} (${duration.toFixed(2)}ms)` : message;
      loglevel.info(`${this.prefix} ⚡ ${perfMsg}`, ...args);
    }
  }

  // Security-related logging (always logged in production)
  security(message: string, ...args: any[]): void {
    loglevel.warn(`${this.prefix} 🔒 ${message}`, ...args);
  }
}

// Error reporting function for production
function reportError(error: any, context: any[] = []): void {
  if (config.logging.enableErrorReporting) {
    // Integration point for error tracking services (Sentry, LogRocket, etc.)
    try {
      // For now, use structured logging that won't be stripped
      const errorData = {
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        version: config.buildInfo.version,
        error: typeof error === 'object' && error.stack ? error.stack : String(error),
        context,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      };
      
      // This console.error will be preserved for error reporting
      console.error('[ML-Platform-Error]', JSON.stringify(errorData));
    } catch (reportingError) {
      // Fallback logging
      console.error('[ML-Platform-Error-Fallback]', error, context);
    }
  }
}

// Pre-configured loggers for different modules
export const mlLogger = new Logger('ML-Platform');
export const fileLogger = new Logger('File-Parser');
export const storageLogger = new Logger('Storage');
export const apiLogger = new Logger('API');
export const uiLogger = new Logger('UI');

// Performance monitoring for production
export const performanceLogger = {
  mark: (name: string) => {
    if (isDev || config.logging.enableConsole) {
      performance.mark(name);
    }
  },
  
  measure: (name: string, startMark: string, endMark?: string) => {
    if (isDev || config.logging.enableConsole) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        mlLogger.performance(`${name}: ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        mlLogger.warn('Performance measurement failed:', error);
      }
    }
  },
  
  time: (label: string) => {
    if (isDev || config.logging.enableConsole) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDev || config.logging.enableConsole) {
      console.timeEnd(label);
    }
  }
};

// Initialize logging configuration on module load
if (isProd) {
  mlLogger.info('ML Platform initialized in production mode');
  mlLogger.info(`Log level: ${config.logging.level}`);
  mlLogger.info(`Build version: ${config.buildInfo.version}`);
} else {
  mlLogger.debug('ML Platform initialized in development mode');
  mlLogger.debug('Full logging enabled');
}

// Default export
export default loglevel;