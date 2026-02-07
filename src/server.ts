import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/apiRoutes';
import errorHandler from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './lib/logger';
import { config } from './config/env';

const app: Express = express();

app.use(helmet());

// Trust first proxy (AWS ALB/ELB)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);

// Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Teamtailor Recruitment Server',
    version: '1.0.0'
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn({ method: req.method, url: req.originalUrl }, 'route not found');
  res.status(404).json({ error: { message: 'Not Found' } });
});

app.use(errorHandler);

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: process.env.NODE_ENV ?? 'development' }, 'server started');
});

export default app;
