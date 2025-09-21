import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoggerService } from './logger.service';

let sentryInitialized = false;

function ensureSentry() {
  if (!sentryInitialized && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        Sentry.httpIntegration({ tracing: true }),
        Sentry.expressIntegration(),
      ],
      beforeSend(event) {
        // Add request context for better error tracking
        if (event.request && event.request.headers) {
          // Remove sensitive headers
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        return event;
      },
    });
    sentryInitialized = true;
  }
}

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    ensureSentry();
    
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    
    // Start performance transaction
    const transaction = Sentry.startTransaction({
      op: 'http',
      name: `${request.method} ${request.route?.path || request.url}`,
      data: {
        method: request.method,
        url: request.url,
        user: request.user?.email || 'anonymous',
      },
    });

    // Set transaction on the scope
    Sentry.getCurrentScope().setSpan(transaction);

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Set response status on success
          transaction.setHttpStatus(response.statusCode);
          transaction.setTag('http.status_code', response.statusCode);
        },
        finalize: () => {
          // Always finish transaction
          const duration = Date.now() - startTime;
          transaction.setTag('response_time', duration);
          transaction.finish();
          
          // Log API call
          this.logger.logApiCall(
            request.method,
            request.url,
            response.statusCode,
            duration,
            { requestId: LoggerService.getRequestId() }
          );
        },
      }),
      catchError((error) => {
        // Enhanced error context
        Sentry.withScope((scope) => {
          scope.setTag('component', 'api');
          scope.setTag('method', request.method);
          scope.setTag('url', request.url);
          scope.setTag('requestId', LoggerService.getRequestId());
          scope.setContext('request', {
            method: request.method,
            url: request.url,
            headers: Object.keys(request.headers),
            user: request.user?.email || 'anonymous',
            requestId: LoggerService.getRequestId(),
          });
          
          // Set transaction as failed
          transaction.setHttpStatus(500);
          transaction.setTag('http.status_code', 500);
          
          Sentry.captureException(error);
        });

        // Log the error
        this.logger.logError(
          error instanceof Error ? error : new Error(String(error)),
          'API request',
          { 
            method: request.method,
            url: request.url,
            statusCode: 500,
            requestId: LoggerService.getRequestId(),
          }
        );
        
        return throwError(() => error);
      }),
    );
  }
}
