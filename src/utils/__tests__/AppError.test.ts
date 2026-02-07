import { describe, it, expect } from 'vitest';
import AppError from '../AppError';

describe('AppError', () => {
  it('sets status to "fail" for 4xx status codes', () => {
    expect(new AppError('Not found', 404).status).toBe('fail');
    expect(new AppError('Bad request', 400).status).toBe('fail');
    expect(new AppError('Unauthorized', 401).status).toBe('fail');
  });

  it('sets status to "error" for 5xx status codes', () => {
    expect(new AppError('Server error', 500).status).toBe('error');
    expect(new AppError('Bad gateway', 502).status).toBe('error');
  });

  it('stores message and statusCode correctly', () => {
    const err = new AppError('Something broke', 503);
    expect(err.message).toBe('Something broke');
    expect(err.statusCode).toBe(503);
  });

  it('stores optional details', () => {
    const details = { field: 'email', reason: 'invalid' };
    const err = new AppError('Validation failed', 400, details);
    expect(err.details).toEqual(details);
  });

  it('leaves details undefined when not provided', () => {
    const err = new AppError('Not found', 404);
    expect(err.details).toBeUndefined();
  });

  it('has isOperational set to true', () => {
    const err = new AppError('Oops', 500);
    expect(err.isOperational).toBe(true);
  });

  it('is an instance of Error', () => {
    const err = new AppError('Test', 400);
    expect(err).toBeInstanceOf(Error);
  });
});
