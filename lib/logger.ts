/**
 * Centralized logging utility for the application
 * Provides structured logging with different log levels and context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  userId?: string
  repoId?: string
  provider?: string
  operation?: string
  duration?: number
  [key: string]: any
}

class Logger {
  private minLevel: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.minLevel = this.getMinLogLevel()
  }

  private getMinLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase()
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG
      case 'INFO': return LogLevel.INFO
      case 'WARN': return LogLevel.WARN
      case 'ERROR': return LogLevel.ERROR
      default: return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(this.sanitizeContext(context))}` : ''
    return `[${timestamp}] ${level}: ${message}${contextStr}`
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context }
    
    // Remove sensitive data from logs
    const sensitiveKeys = ['token', 'password', 'secret', 'apiKey', 'accessToken', 'encryptedToken']
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]'
      }
    })
    
    return sanitized
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack, name: error.name }
        : { error: String(error) }
      
      const fullContext = { ...context, ...errorDetails }
      console.error(this.formatMessage('ERROR', message, fullContext))
    }
  }

  // API request logging
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, context)
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    const message = `API Response: ${method} ${path} - ${statusCode} (${duration}ms)`
    
    if (level === LogLevel.WARN) {
      this.warn(message, { ...context, statusCode, duration })
    } else {
      this.info(message, { ...context, statusCode, duration })
    }
  }

  // Database operation logging
  dbQuery(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB Query: ${operation} on ${table}`, context)
  }

  dbQueryComplete(operation: string, table: string, duration: number, rowCount?: number, context?: LogContext): void {
    this.debug(`DB Query Complete: ${operation} on ${table} (${duration}ms)`, { 
      ...context, 
      duration, 
      rowCount 
    })
  }

  // External API calls
  externalApiCall(service: string, endpoint: string, context?: LogContext): void {
    this.info(`External API Call: ${service} - ${endpoint}`, context)
  }

  externalApiResponse(service: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    const message = `External API Response: ${service} - ${endpoint} - ${statusCode} (${duration}ms)`
    
    if (level === LogLevel.WARN) {
      this.warn(message, { ...context, statusCode, duration })
    } else {
      this.info(message, { ...context, statusCode, duration })
    }
  }

  // Authentication events
  authEvent(event: string, context?: LogContext): void {
    this.info(`Auth Event: ${event}`, context)
  }

  // Security events
  securityEvent(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, context)
  }

  // Performance tracking
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO
    const message = `Performance: ${operation} took ${duration}ms`
    
    if (level === LogLevel.WARN) {
      this.warn(message, { ...context, duration, slow: true })
    } else {
      this.info(message, { ...context, duration })
    }
  }
}

// Export a singleton instance
export const logger = new Logger()

// Utility function to measure execution time
export async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const startTime = Date.now()
  logger.debug(`Starting: ${operation}`, context)
  
  try {
    const result = await fn()
    const duration = Date.now() - startTime
    logger.performance(operation, duration, context)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`Failed: ${operation} (${duration}ms)`, error, context)
    throw error
  }
}
