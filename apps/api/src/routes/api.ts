import { Router } from "express";
import { authRouter } from "./auth.js";
import { keysRouter } from "./keys.js";
import { teamsRouter } from "./teams.js";
import { usageRouter } from "./usage.js";
import { auditRouter } from "./audit.js";
import { orgsRouter } from "./orgs.js";
import { gatewayRouter } from "./gateway.js";
import { billingRouter } from "./billing.js";
import { providerKeysRouter } from "./provider-keys.js";
import {
  authenticateApiKey,
  withClerkAuth,
  authenticateClerkUser,
  requireAdmin,
} from "../middleware/auth.js";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.json({ message: "Proxoria Platform API v1" });
});

// Clerk webhooks — no auth, has its own signature verification
apiRouter.use("/auth", authRouter);

// Gateway routes — API key authentication
apiRouter.use("/gateway", authenticateApiKey, gatewayRouter);

// Dashboard management routes — Clerk JWT authentication
// Apply Clerk middleware first, then our resolver that maps clerkOrgId → req.orgId
apiRouter.use(
  "/keys",
  withClerkAuth,
  authenticateClerkUser,
  requireAdmin,
  keysRouter,
);

apiRouter.use(
  "/usage",
  withClerkAuth,
  authenticateClerkUser,
  usageRouter,
);

apiRouter.use(
  "/teams",
  withClerkAuth,
  authenticateClerkUser,
  teamsRouter,
);

apiRouter.use(
  "/orgs",
  withClerkAuth,
  authenticateClerkUser,
  orgsRouter,
);

apiRouter.use(
  "/audit",
  withClerkAuth,
  authenticateClerkUser,
  requireAdmin,
  auditRouter,
);

// Billing — webhook has its own raw-body parser and no auth; other routes use Clerk auth (applied per-route in billingRouter)
apiRouter.use("/billing", billingRouter);

// Provider keys (BYOK) — admin only
apiRouter.use(
  "/provider-keys",
  withClerkAuth,
  authenticateClerkUser,
  requireAdmin,
  providerKeysRouter,
);
