import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { requestContext } from '../lib/requestContext';
import { logger } from '../lib/logger';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) ?? crypto.randomUUID();
  const start = Date.now();

  res.setHeader('X-Request-ID', requestId);

  requestContext.run({ requestId }, () => {
    logger.info({ method: req.method, url: req.originalUrl }, 'request started');

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(
        { method: req.method, url: req.originalUrl, statusCode: res.statusCode, duration: `${duration}ms` },
        'request completed',
      );
    });

    next();
  });
}
