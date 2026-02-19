// Logging Middleware
import { NextRequest, NextResponse } from 'next/server';

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  status?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
  userId?: string;
  error?: string;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log levels
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'info';

// Format log entry
function formatLogEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    entry.method,
    entry.path,
    entry.status ? `${entry.status}` : '',
    entry.duration ? `${entry.duration}ms` : '',
    entry.userId ? `user:${entry.userId}` : '',
  ].filter(Boolean);
  
  return parts.join(' ');
}

// Check if should log at level
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LOG_LEVEL];
}

// Log functions
export function logDebug(message: string, data?: unknown): void {
  if (shouldLog('debug')) {
    console.debug(`[DEBUG] ${message}`, data ?? '');
  }
}

export function logInfo(message: string, data?: unknown): void {
  if (shouldLog('info')) {
    console.info(`[INFO] ${message}`, data ?? '');
  }
}

export function logWarn(message: string, data?: unknown): void {
  if (shouldLog('warn')) {
    console.warn(`[WARN] ${message}`, data ?? '');
  }
}

export function logError(message: string, error?: unknown): void {
  if (shouldLog('error')) {
    console.error(`[ERROR] ${message}`, error ?? '');
  }
}

// Create request logger
export function createRequestLogger(request: NextRequest) {
  const startTime = Date.now();
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: new URL(request.url).pathname,
    ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
  
  return {
    setUserId(userId: string) {
      entry.userId = userId;
    },
    
    logRequest() {
      logInfo(`→ ${entry.method} ${entry.path}`);
    },
    
    logResponse(response: NextResponse) {
      entry.status = response.status;
      entry.duration = Date.now() - startTime;
      
      const logFn = entry.status >= 500 ? logError : 
                    entry.status >= 400 ? logWarn : logInfo;
      
      logFn(`← ${formatLogEntry(entry)}`);
    },
    
    logError(error: Error) {
      entry.error = error.message;
      entry.duration = Date.now() - startTime;
      logError(`✖ ${entry.method} ${entry.path}: ${error.message}`);
    },
  };
}

// Request logging middleware wrapper
export function withLogging(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    const logger = createRequestLogger(request);
    logger.logRequest();
    
    try {
      const response = await handler(request, ...args);
      logger.logResponse(response);
      return response;
    } catch (error) {
      logger.logError(error as Error);
      throw error;
    }
  };
}
