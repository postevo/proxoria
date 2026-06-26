import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { logger } from "./lib/logger.js";
import { gatewayRouter } from "./routes/gateway.js";
import { authRouter } from "./routes/auth.js";
import { usageRouter } from "./routes/usage.js";
import { keysRouter } from "./routes/keys.js";
import { teamsRouter } from "./routes/teams.js";
import { auditRouter } from "./routes/audit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authenticateApiKey } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Parsing
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Health check (unauthenticated)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: process.env.npm_package_version || "0.1.0" });
});

// Auth routes (Clerk webhooks, internal token exchange)
app.use("/auth", authRouter);

// All other routes require API key
app.use("/v1", authenticateApiKey);
app.use("/v1/gateway", gatewayRouter);
app.use("/v1/usage", usageRouter);
app.use("/v1/keys", keysRouter);
app.use("/v1/teams", teamsRouter);
app.use("/v1/audit", auditRouter);

// Error handler must be last
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`AI Gateway API running on port ${PORT}`);
});

export default app;
