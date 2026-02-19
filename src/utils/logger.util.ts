// Logger utilities

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
  context?: string;
}

// Log levels priority
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Current log level from environment
const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

// Check if should log
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

// Format log entry
function formatLog(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.context ? `[${entry.context}]` : '',
    entry.message,
  ].filter(Boolean);
  
  return parts.join(' ');
}

// Create logger instance
export function createLogger(context?: string) {
  const log = (level: LogLevel, message: string, data?: unknown) => {
    if (!shouldLog(level)) return;
    
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      context,
    };
    
    const formattedMessage = formatLog(entry);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data ?? '');
        break;
      case 'info':
        console.info(formattedMessage, data ?? '');
        break;
      case 'warn':
        console.warn(formattedMessage, data ?? '');
        break;
      case 'error':
        console.error(formattedMessage, data ?? '');
        break;
    }
  };
  
  return {
    debug: (message: string, data?: unknown) => log('debug', message, data),
    info: (message: string, data?: unknown) => log('info', message, data),
    warn: (message: string, data?: unknown) => log('warn', message, data),
    error: (message: string, data?: unknown) => log('error', message, data),
  };
}

// Default logger
export const logger = createLogger();

// Log request
export function logRequest(method: string, path: string, statusCode?: number, duration?: number) {
  const parts = [method, path, statusCode, duration ? `${duration}ms` : ''].filter(Boolean);
  logger.info(parts.join(' '));
}

// Log error
export function logError(error: Error, context?: string) {
  const errorLogger = createLogger(context);
  errorLogger.error(error.message, { stack: error.stack });
}

// Log database query (for development)
export function logQuery(query: string, params?: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    const dbLogger = createLogger('DB');
    dbLogger.debug(query, params);
  }
}

// Log API call
export function logApiCall(service: string, method: string, url: string, status?: number) {
  const apiLogger = createLogger('API');
  apiLogger.info(`${service}: ${method} ${url} ${status ?? ''}`);
}

// Log authentication events
export function logAuth(event: string, userId?: string, success: boolean = true) {
  const authLogger = createLogger('AUTH');
  const level = success ? 'info' : 'warn';
  authLogger[level](`${event} ${userId ?? 'unknown'}`);
}

// Performance logger
export function createPerfLogger(label: string) {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      const perfLogger = createLogger('PERF');
      perfLogger.debug(`${label}: ${duration.toFixed(2)}ms`);
      return duration;
    },
  };
}
