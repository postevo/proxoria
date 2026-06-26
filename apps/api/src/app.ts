import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { healthRouter } from './routes/health';
import { apiRouter } from './routes/api';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
  const app = express();

  // Security & parsing
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('combined'));

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/v1', apiRouter);

  // Error handling
  app.use(errorHandler);

  return app;
}
