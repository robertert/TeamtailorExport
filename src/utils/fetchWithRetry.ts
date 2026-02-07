import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { setTimeout } from 'timers/promises';
import { logger } from '../lib/logger';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

export interface FetchWithRetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

/**
 * Determines if an error is retryable (429, 5xx, or network error).
 */
export function isRetryable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  const status = error.response.status;
  return status === 429 || status >= 500;
}

/**
 * Calculates delay before next retry. Uses Retry-After header for 429 when present.
 */
export function calculateDelay(
  attempt: number,
  error: unknown,
  baseDelayMs: number,
): number {
  if (axios.isAxiosError(error) && error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (Number.isFinite(seconds) && seconds > 0) {
        return seconds * 1000;
      }
    }
  }

  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  return Math.round(Math.random() * exponentialDelay);
}

/**
 * Performs a GET request with retry and exponential backoff.
 * Retries on 429, 5xx, and network errors (no response).
 */
export async function fetchWithRetry<T = unknown>(
  axiosInstance: AxiosInstance,
  url: string,
  params?: Record<string, unknown>,
  signal?: AbortSignal,
  options: FetchWithRetryOptions = {},
): Promise<AxiosResponse<T>> {
  const { maxRetries = DEFAULT_MAX_RETRIES, baseDelayMs = DEFAULT_BASE_DELAY_MS } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await axiosInstance.get<T>(url, { params, signal });
    } catch (error) {
      if (signal?.aborted || axios.isCancel(error)) {
        throw error;
      }

      if (!isRetryable(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = calculateDelay(attempt, error, baseDelayMs);
      logger.warn(
        {
          attempt: attempt + 1,
          maxRetries,
          delayMs: delay,
          error: (error as Error).message,
        },
        'retrying API request',
      );
      await setTimeout(delay, undefined, { signal });
    }
  }

  throw new Error('unreachable');
}
