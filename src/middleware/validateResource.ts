import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import AppError from '../utils/AppError';

type RequestInput = { body?: unknown; query?: unknown; params?: unknown };

export const validateResource = (schema: z.ZodType<RequestInput>) =>
  (req: Request, _: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new AppError('Validation Error', 400, error.issues));
      }
      next(error);
    }
  };
