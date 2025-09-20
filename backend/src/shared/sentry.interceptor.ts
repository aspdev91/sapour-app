import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

let sentryInitialized = false;

function ensureSentry() {
  if (!sentryInitialized && process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
    sentryInitialized = true;
  }
}

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    ensureSentry();
    return next.handle().pipe(
      tap({
        error: (err: unknown) => {
          Sentry.captureException(err);
        },
      }),
    );
  }
}
