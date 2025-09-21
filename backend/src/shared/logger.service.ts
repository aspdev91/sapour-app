import { Injectable, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface LogContext {
  requestId?: string;
  userId?: string;
  userEmail?: string;
  method?: string;
  url?: string;
  timestamp?: string;
}

@Injectable()
export class LoggerService extends Logger {
  private static asyncLocalStorage = new AsyncLocalStorage<LogContext>();

  static setContext(context: LogContext) {
    const existingContext = this.asyncLocalStorage.getStore() || {};
    const newContext = { ...existingContext, ...context };
    return this.asyncLocalStorage.enterWith(newContext);
  }

  static getContext(): LogContext {
    return this.asyncLocalStorage.getStore() || {};
  }

  static getRequestId(): string | undefined {
    return this.getContext().requestId;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const context = LoggerService.getContext();
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      level,
      message,
      requestId: context.requestId,
      userId: context.userId,
      userEmail: context.userEmail,
      method: context.method,
      url: context.url,
      ...(meta && { meta }),
    };

    // Filter out undefined values
    const filteredEntry = Object.fromEntries(
      Object.entries(logEntry).filter(([, value]) => value !== undefined)
    );

    return JSON.stringify(filteredEntry);
  }

  log(message: string, meta?: any) {
    super.log(this.formatMessage('info', message, meta));
  }

  error(message: string, trace?: string, meta?: any) {
    const errorMeta = { ...meta, ...(trace && { trace }) };
    super.error(this.formatMessage('error', message, errorMeta));
  }

  warn(message: string, meta?: any) {
    super.warn(this.formatMessage('warn', message, meta));
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      super.debug(this.formatMessage('debug', message, meta));
    }
  }

  verbose(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      super.verbose(this.formatMessage('verbose', message, meta));
    }
  }

  // Structured logging methods
  logUserAction(action: string, userId: string, meta?: any) {
    this.log(`User action: ${action}`, { userId, action, ...meta });
  }

  logApiCall(method: string, url: string, statusCode: number, duration: number, meta?: any) {
    this.log(`API call: ${method} ${url}`, {
      method,
      url,
      statusCode,
      duration,
      ...meta
    });
  }

  logError(error: Error, context?: string, meta?: any) {
    this.error(
      `Error${context ? ` in ${context}` : ''}: ${error.message}`,
      error.stack,
      { errorName: error.name, context, ...meta }
    );
  }

  logAnalysisEvent(mediaId: string, type: 'image' | 'audio', status: string, meta?: any) {
    this.log(`Analysis event: ${type} ${status}`, {
      mediaId,
      type,
      status,
      event: 'media_analysis',
      ...meta
    });
  }

  logReportGeneration(reportId: string, reportType: string, duration: number, meta?: any) {
    this.log(`Report generated: ${reportType}`, {
      reportId,
      reportType,
      duration,
      event: 'report_generation',
      ...meta
    });
  }
}
