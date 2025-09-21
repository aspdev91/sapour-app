import React from 'react';
import * as Sentry from '@sentry/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-destructive">Something went wrong</CardTitle>
        <CardDescription>An unexpected error occurred. Our team has been notified.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
          {error.message}
        </div>
        <div className="flex gap-2">
          <Button onClick={resetError} variant="outline" className="flex-1">
            Try Again
          </Button>
          <Button onClick={() => (window.location.href = '/')} className="flex-1">
            Go Home
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: ({ resetError }: { error: Error; resetError: () => void }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-4 text-center">
        We're sorry, but something unexpected happened. Please try refreshing the page.
      </p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  ),
    beforeCapture: (scope, _error, errorInfo) => {
      scope.setTag('component', 'ErrorBoundary');
      scope.setLevel('error');
      scope.setContext('errorBoundary', {
        componentStack: (errorInfo as any)?.componentStack || 'Unknown component stack',
      });
    },
  },
);

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback: CustomFallback,
}) => {
  if (CustomFallback) {
    return (
      <Sentry.ErrorBoundary fallback={CustomFallback} showDialog>
        {children}
      </Sentry.ErrorBoundary>
    );
  }

  return <SentryErrorBoundary>{children}</SentryErrorBoundary>;
};

export default ErrorBoundary;
