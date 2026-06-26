import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { healthRouter } from './routes/health.js';
import { apiRouter } from './routes/api.js';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { logger } from './lib/logger.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Stripe webhook must receive a raw Buffer for signature verification.
  // This middleware runs before express.json() so the body stream is not consumed first.
  app.use('/v1/billing/webhook', express.raw({ type: 'application/json' }));

  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

  app.use('/health', healthRouter);

  // Keep /auth at the root for Clerk webhook backward compatibility.
  app.use('/auth', authRouter);

  app.use('/v1', apiRouter);

  app.use(errorHandler);

  return app;
}
