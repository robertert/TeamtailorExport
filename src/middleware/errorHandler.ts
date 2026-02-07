import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import { logger } from '../lib/logger';

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode: number = 500;
  let status: string = 'error';
  let message: string = err.message || 'Internal Server Error';
  let details: object = {};

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.status;
    details = err.details ?? {};
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  const logData = { err, statusCode, status };
  if (statusCode >= 500) {
    logger.error(logData, message);
  } else {
    logger.warn(logData, message);
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      message: message,
      status: status,
      ...details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export default errorHandler;
