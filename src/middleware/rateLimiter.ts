import rateLimit from 'express-rate-limit';
import AppError from '../utils/AppError';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LIMIT = 100;
const DEFAULT_MESSAGE = 'Too many requests, please try again later.';

export function createRateLimiter(
  windowMs = DEFAULT_WINDOW_MS,
  limit = DEFAULT_LIMIT,
  message = DEFAULT_MESSAGE,
) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { message } },
    handler: (_req, _res, next) => {
      next(new AppError(message, 429));
    },
  });
}

export const rateLimiter = createRateLimiter();
