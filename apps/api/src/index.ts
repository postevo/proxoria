import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { logger } from "./lib/logger.js";
import { apiRouter } from "./routes/api.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { scheduleDailyBudgetAlerts } from "./services/budget-alerts.service.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Rate limiting — generous for API gateway workloads
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stripe webhook must receive raw body for signature verification — must run before express.json()
app.use("/v1/billing/webhook", express.raw({ type: "application/json" }));

// Body parsing for all other routes
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Health check (unauthenticated)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: process.env.npm_package_version || "0.1.0" });
});

// Keep /auth at root for Clerk webhook backward compatibility
app.use("/auth", authRouter);

// All versioned routes
app.use("/v1", apiRouter);

// Error handler must be last
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`AI Gateway API running on port ${PORT}`);
  scheduleDailyBudgetAlerts();
});

export default app;
