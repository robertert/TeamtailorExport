import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { ZodError } from 'zod';
import AppError from '../utils/AppError';
import { logger } from '../lib/logger';

const GENERIC_MESSAGE = 'Internal Server Error';

/* ERROR HANDLER MIDDLEWARE */


const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode: number = 500;
  let status: string = 'error';
  let message: string = GENERIC_MESSAGE;
  let details: object = {};

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
    details = err.details ?? {};
    if (statusCode >= 500) {
      logger.error({ err, statusCode, status }, message);
    } else {
      logger.warn({ err, statusCode, status }, message);
    }
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    logger.warn({ err, statusCode, status }, message);
  } else if (axios.isAxiosError(err)) {
    if (!err.response) {
      statusCode = 503;
      message = 'Service temporarily unavailable';
      logger.error({ err, stack: err.stack }, 'Network unreachable');
    } else {
      const responseStatus = err.response.status;
      if (responseStatus === 401 || responseStatus === 403) {
        statusCode = 500;
        message = GENERIC_MESSAGE;
        logger.error(
          { err, stack: err.stack },
          'Invalid Teamtailor API configuration'
        );
      } else if (responseStatus === 429) {
        statusCode = 503;
        message = 'Service overloaded';
        logger.warn({ err, statusCode }, 'Teamtailor API throttling');
      } else if (responseStatus >= 500) {
        statusCode = 502;
        message = 'External service error';
        logger.error(
          { err, statusCode },
          'Upstream service (Teamtailor) failed'
        );
      } else {
        statusCode = 500;
        message = GENERIC_MESSAGE;
        logger.error({ err, stack: err.stack }, 'Upstream API error');
      }
    }
  } else if (err instanceof ZodError) {
    statusCode = 500;
    message = GENERIC_MESSAGE;
    logger.error(
      { err, issues: err.issues, stack: err.stack },
      'External API contract mismatch'
    );
  } else {
    statusCode = 500;
    message = GENERIC_MESSAGE;
    logger.error({ err, stack: err?.stack }, 'Unhandled error');
  }

  if (!(err instanceof AppError)) {
    status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
  }

  res.status(statusCode).json({
    error: {
      message,
      status,
      ...details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

export default errorHandler;
