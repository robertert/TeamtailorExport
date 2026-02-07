import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import routes from './routes/apiRoutes';
import errorHandler from './middleware/errorHandler';
import { config } from './config/env';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { message: 'Not Found' } });
});

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
