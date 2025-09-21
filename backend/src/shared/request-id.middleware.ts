import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from './logger.service';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate or use existing request ID
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Set request ID in headers
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    // Set logging context
    LoggerService.setContext({
      requestId,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
    });

    // Add request ID to request object for easy access
    (req as any).requestId = requestId;

    next();
  }
}
