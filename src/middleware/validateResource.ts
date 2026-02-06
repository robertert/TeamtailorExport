import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import AppError from '../utils/AppError';

export const validateResource = (schema: ZodObject<any>) => 
  (req: Request, _: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError('Validation Error', 400);
      }
      next(error);
    }
  };
