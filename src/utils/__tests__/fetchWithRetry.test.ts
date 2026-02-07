import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError } from 'axios';
import {
  fetchWithRetry,
  isRetryable,
  calculateDelay,
} from '../fetchWithRetry';

vi.mock('../../lib/logger', () => ({
  logger: { warn: vi.fn() },
}));

vi.mock('timers/promises', () => ({
  setTimeout: vi.fn().mockResolvedValue(undefined),
}));

import { setTimeout as mockedSetTimeout } from 'timers/promises';

function makeAxiosError(
  status: number,
  message: string,
  headers: Record<string, string> = {},
) {
  return new AxiosError(
    message,
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    { status, data: {}, statusText: message, headers, config: {} } as never,
  );
}

function makeNetworkError(message: string) {
  return new AxiosError(message, 'ECONNRESET', undefined, undefined, undefined);
}

describe('isRetryable', () => {
  it('returns true for 429', () => {
    expect(isRetryable(makeAxiosError(429, 'Too Many Requests'))).toBe(true);
  });

  it('returns true for 5xx', () => {
    expect(isRetryable(makeAxiosError(500, 'Internal Server Error'))).toBe(true);
    expect(isRetryable(makeAxiosError(502, 'Bad Gateway'))).toBe(true);
    expect(isRetryable(makeAxiosError(503, 'Service Unavailable'))).toBe(true);
  });

  it('returns true for network error (no response)', () => {
    expect(isRetryable(makeNetworkError('ECONNRESET'))).toBe(true);
  });

  it('returns false for 4xx (except retryable)', () => {
    expect(isRetryable(makeAxiosError(400, 'Bad Request'))).toBe(false);
    expect(isRetryable(makeAxiosError(401, 'Unauthorized'))).toBe(false);
    expect(isRetryable(makeAxiosError(404, 'Not Found'))).toBe(false);
  });

  it('returns false for non-axios error', () => {
    expect(isRetryable(new Error('generic'))).toBe(false);
  });
});

describe('calculateDelay', () => {
  it('uses Retry-After header (seconds) for 429', () => {
    const err = makeAxiosError(429, 'Too Many Requests', { 'retry-after': '5' });
    expect(calculateDelay(0, err, 1000)).toBe(5000);
  });

  it('uses exponential backoff for 429 when Retry-After invalid', () => {
    const err = makeAxiosError(429, 'Too Many Requests');
    const spy = vi.spyOn(Math, 'random').mockReturnValue(1);
    expect(calculateDelay(0, err, 1000)).toBe(1000);
    expect(calculateDelay(1, err, 1000)).toBe(2000);
    spy.mockRestore();
  });

  it('uses exponential backoff for non-429 retryable errors', () => {
    const err = makeAxiosError(500, 'Internal Server Error');
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(calculateDelay(0, err, 1000)).toBe(500);
    expect(calculateDelay(1, err, 1000)).toBe(1000);
    spy.mockRestore();
  });
});

describe('fetchWithRetry', () => {
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGet = vi.fn();
    vi.mocked(mockedSetTimeout).mockClear();
  });

  it('returns response on first success', async () => {
    const client = { get: mockGet };
    mockGet.mockResolvedValueOnce({ data: { ok: true } });

    const result = await fetchWithRetry(
      client as never,
      '/test',
      { foo: 'bar' },
      undefined,
    );

    expect(result.data).toEqual({ ok: true });
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/test', {
      params: { foo: 'bar' },
      signal: undefined,
    });
  });

  it('retries on 429 and succeeds', async () => {
    const client = { get: mockGet };
    const error429 = makeAxiosError(429, 'Too Many Requests');
    mockGet
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({ data: { ok: true } });

    const result = await fetchWithRetry(client as never, '/test', undefined, undefined);

    expect(result.data).toEqual({ ok: true });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('retries on 500 and succeeds', async () => {
    const client = { get: mockGet };
    const error500 = makeAxiosError(500, 'Internal Server Error');
    mockGet
      .mockRejectedValueOnce(error500)
      .mockResolvedValueOnce({ data: { ok: true } });

    const result = await fetchWithRetry(client as never, '/test', undefined, undefined);

    expect(result.data).toEqual({ ok: true });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 400', async () => {
    const client = { get: mockGet };
    const error400 = makeAxiosError(400, 'Bad Request');
    mockGet.mockRejectedValueOnce(error400);

    await expect(
      fetchWithRetry(client as never, '/test', undefined, undefined),
    ).rejects.toThrow(error400);

    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('uses Retry-After for 429 delay', async () => {
    const client = { get: mockGet };
    const error429 = makeAxiosError(429, 'Too Many Requests', { 'retry-after': '5' });
    mockGet
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({ data: {} });

    await fetchWithRetry(client as never, '/test', undefined, undefined);

    expect(mockedSetTimeout).toHaveBeenCalledWith(5000, undefined, expect.any(Object));
  });

  it('throws after max retries exceeded', async () => {
    const client = { get: mockGet };
    const error500 = makeAxiosError(500, 'Internal Server Error');
    mockGet.mockRejectedValue(error500);

    await expect(
      fetchWithRetry(client as never, '/test', undefined, undefined, { maxRetries: 2 }),
    ).rejects.toThrow(error500);

    expect(mockGet).toHaveBeenCalledTimes(3);
    expect(mockedSetTimeout).toHaveBeenCalledTimes(2);
  });

  it('respects custom maxRetries and baseDelayMs', async () => {
    const client = { get: mockGet };
    const error500 = makeAxiosError(500, 'Internal Server Error');
    mockGet.mockRejectedValue(error500);
    const spy = vi.spyOn(Math, 'random').mockReturnValue(1);

    await expect(
      fetchWithRetry(client as never, '/test', undefined, undefined, {
        maxRetries: 1,
        baseDelayMs: 500,
      }),
    ).rejects.toThrow(error500);

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockedSetTimeout).toHaveBeenCalledWith(500, undefined, expect.any(Object));
    spy.mockRestore();
  });

  it('throws immediately when signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const client = { get: mockGet };
    mockGet.mockRejectedValue(new AxiosError('canceled', 'ERR_CANCELED'));

    await expect(
      fetchWithRetry(client as never, '/test', undefined, controller.signal),
    ).rejects.toBeDefined();

    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('stops retrying when signal is aborted during delay', async () => {
    const controller = new AbortController();
    const client = { get: mockGet };
    const error500 = makeAxiosError(500, 'Internal Server Error');
    mockGet.mockRejectedValueOnce(error500);

    vi.mocked(mockedSetTimeout).mockImplementationOnce(async () => {
      controller.abort();
      throw new DOMException('Aborted', 'AbortError');
    });

    await expect(
      fetchWithRetry(client as never, '/test', undefined, controller.signal),
    ).rejects.toBeDefined();

    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
