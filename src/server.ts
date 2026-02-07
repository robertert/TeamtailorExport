import { config } from './config/env';
import path from 'path';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/apiRoutes';
import errorHandler from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './lib/logger';
import { registerGracefulShutdown } from './lib/gracefulShutdown';

const app: Express = express();

app.use(helmet({
  // HSTS is disabled intentionally to avoid SSL certificate issues on localhost (especially in Safari/macOS).
  // In production (behind AWS Load Balancer) HSTS should be enabled.
  hsts: false,
  contentSecurityPolicy: false,
}));

// Trust first proxy (AWS ALB/ELB)
app.set('trust proxy', 1);

app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  credentials: true,
}));

// Middleware
app.use(rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', routes);

// Serve frontend static assets
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

// SPA catch-all — serves index.html for non-API routes
app.get('*path', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

app.use(errorHandler);

const server = app.listen(config.PORT, '0.0.0.0', () => {
  logger.info({ port: config.PORT, env: process.env.NODE_ENV ?? 'development' }, 'server started');
});

registerGracefulShutdown(server);

export default app;
