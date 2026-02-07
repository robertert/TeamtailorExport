import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Default error

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
