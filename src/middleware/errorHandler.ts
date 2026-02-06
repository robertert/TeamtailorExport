import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // Default error
  let statusCode: number = err.statusCode || 500;
  let status: string = err.status || 'error';
  let message: string = err.message || 'Internal Server Error';

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
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export default errorHandler;
