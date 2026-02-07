import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { AxiosError } from 'axios';
import { ZodError } from 'zod';
import errorHandler from '../errorHandler';
import AppError from '../../utils/AppError';

vi.mock('../../lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  return res;
}

describe('errorHandler', () => {
  const mockReq = {} as Request;
  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends AppError status and message to client', () => {
    const res = createMockRes();
    const err = new AppError('Not found', 404);

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Not found',
          status: 'fail',
        }),
      })
    );
  });

  it('sends 500 for AxiosError 401 (invalid API config, not client auth)', () => {
    const res = createMockRes();
    const err = new AxiosError(
      'Unauthorized',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 401,
        data: {},
        statusText: 'Unauthorized',
        headers: {},
        config: {},
      } as never
    );

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Internal Server Error',
          status: 'error',
        }),
      })
    );
  });

  it('sends 500 for AxiosError 403', () => {
    const res = createMockRes();
    const err = new AxiosError(
      'Forbidden',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 403,
        data: {},
        statusText: 'Forbidden',
        headers: {},
        config: {},
      } as never
    );

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Internal Server Error',
          status: 'error',
        }),
      })
    );
  });

  it('sends 503 for AxiosError 429 (throttling)', () => {
    const res = createMockRes();
    const err = new AxiosError(
      'Too Many Requests',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 429,
        data: {},
        statusText: 'Too Many Requests',
        headers: {},
        config: {},
      } as never
    );

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Service overloaded',
          status: 'error',
        }),
      })
    );
  });

  it('sends 502 for AxiosError 5xx (upstream failure)', () => {
    const res = createMockRes();
    const err = new AxiosError(
      'Internal Server Error',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status: 502,
        data: {},
        statusText: 'Bad Gateway',
        headers: {},
        config: {},
      } as never
    );

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'External service error',
          status: 'error',
        }),
      })
    );
  });

  it('sends 503 for AxiosError without response (network)', () => {
    const res = createMockRes();
    const err = new AxiosError('Network Error', 'ERR_NETWORK');

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Service temporarily unavailable',
          status: 'error',
        }),
      })
    );
  });

  it('sends 500 for ZodError (external API contract mismatch)', () => {
    const res = createMockRes();
    const err = new ZodError([
      { code: 'invalid_type', path: ['data'], expected: 'array', message: 'Expected array' },
    ]);

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Internal Server Error',
          status: 'error',
        }),
      })
    );
  });

  it('sends 500 and generic message for unknown Error', () => {
    const res = createMockRes();
    const err = new Error('Some internal bug');

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Internal Server Error',
          status: 'error',
        }),
      })
    );
  });

  it('sends 400 for ValidationError (Mongoose)', () => {
    const res = createMockRes();
    const err = new Error('Validation failed');
    err.name = 'ValidationError';

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Validation Error',
          status: 'fail',
        }),
      })
    );
  });
});
