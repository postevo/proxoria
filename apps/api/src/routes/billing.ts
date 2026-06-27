import express, { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { withClerkAuth, authenticateClerkUser } from "../middleware/auth.js";
import {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  getInvoices,
  handleWebhookEvent,
} from "../services/billing.service.js";
import { logger } from "../lib/logger.js";

export const billingRouter = Router();

function isAllowedReturnUrl(url: string): boolean {
  const allowedOrigin = process.env.ALLOWED_FRONTEND_URL;
  if (!allowedOrigin) return false;
  return url.startsWith(allowedOrigin);
}

const CheckoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// POST /billing/checkout — create Stripe Checkout session
billingRouter.post(
  "/checkout",
  withClerkAuth,
  authenticateClerkUser,
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = CheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }

    if (!isAllowedReturnUrl(parsed.data.successUrl)) {
      res.status(400).json({ error: "Invalid successUrl" });
      return;
    }
    if (!isAllowedReturnUrl(parsed.data.cancelUrl)) {
      res.status(400).json({ error: "Invalid cancelUrl" });
      return;
    }

    try {
      const url = await createCheckoutSession(
        req.orgId,
        parsed.data.plan,
        parsed.data.successUrl,
        parsed.data.cancelUrl,
      );
      res.json({ url });
    } catch (err) {
      next(err);
    }
  },
);

// POST /billing/portal — customer self-service portal
billingRouter.post(
  "/portal",
  withClerkAuth,
  authenticateClerkUser,
  async (req: Request, res: Response, next: NextFunction) => {
    const returnUrl = req.body.returnUrl as string | undefined;
    if (!returnUrl) {
      res.status(400).json({ error: "returnUrl is required" });
      return;
    }

    if (!isAllowedReturnUrl(returnUrl)) {
      res.status(400).json({ error: "Invalid returnUrl" });
      return;
    }

    try {
      const url = await createPortalSession(req.orgId, returnUrl);
      res.json({ url });
    } catch (err) {
      next(err);
    }
  },
);

// GET /billing/status — current subscription state
billingRouter.get(
  "/status",
  withClerkAuth,
  authenticateClerkUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await getSubscriptionStatus(req.orgId);
      res.json(status);
    } catch (err) {
      next(err);
    }
  },
);

// GET /billing/invoices — invoice history
billingRouter.get(
  "/invoices",
  withClerkAuth,
  authenticateClerkUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoices = await getInvoices(req.orgId);
      res.json({ data: invoices });
    } catch (err) {
      next(err);
    }
  },
);

// POST /billing/webhook — Stripe webhook (raw body, no auth middleware)
billingRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    try {
      await handleWebhookEvent(req.body as Buffer, signature);
      res.json({ received: true });
    } catch (err) {
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: String(err) });
    }
  },
);
