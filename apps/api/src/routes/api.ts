import { Router } from 'express';

export const apiRouter = Router();

// Placeholder — IAM-4 will add /gateway routes, IAM-5 will add /auth routes
apiRouter.get('/', (_req, res) => {
  res.json({ message: 'AI Gateway Platform API v1' });
});
