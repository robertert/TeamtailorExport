import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRateLimiter, rateLimiter } from '../rateLimiter';
import errorHandler from '../errorHandler';

function createApp(limiter = rateLimiter) {
  const app = express();
  app.use(limiter);
  app.get('/test', (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

describe('rateLimiter', () => {
  it('allows requests under the limit', async () => {
    const app = createApp();

    const res = await request(app).get('/test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns RateLimit headers (draft-7)', async () => {
    const app = createApp();

    const res = await request(app).get('/test');

    expect(res.headers['ratelimit']).toBeDefined();
    expect(res.headers['ratelimit-policy']).toBeDefined();
  });

  it('returns 429 with AppError format when limit is exceeded', async () => {
    const app = createApp(createRateLimiter(60_000, 2));

    await request(app).get('/test');
    await request(app).get('/test');

    const res = await request(app).get('/test');

    expect(res.status).toBe(429);
    expect(res.body.error.message).toBe('Too many requests, please try again later.');
    expect(res.body.error.status).toBe('fail');
  });

  it('does not include legacy X-RateLimit-* headers', async () => {
    const app = createApp();

    const res = await request(app).get('/test');

    expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    expect(res.headers['x-ratelimit-remaining']).toBeUndefined();
    expect(res.headers['x-ratelimit-reset']).toBeUndefined();
  });
});
