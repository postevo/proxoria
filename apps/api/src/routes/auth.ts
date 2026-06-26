import { Router, Request, Response, NextFunction } from "express";
import { Webhook } from "svix";
import { prisma } from "../lib/db.js";
import { logger } from "../lib/logger.js";

export const authRouter = Router();

// POST /auth/clerk/webhook - Clerk webhook for org/user sync
authRouter.post(
  "/clerk/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response, next: NextFunction) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    try {
      const wh = new Webhook(secret);
      const event = wh.verify(req.body, {
        "svix-id": req.headers["svix-id"] as string,
        "svix-timestamp": req.headers["svix-timestamp"] as string,
        "svix-signature": req.headers["svix-signature"] as string,
      }) as { type: string; data: Record<string, unknown> };

      if (event.type === "organization.created") {
        const data = event.data as { id: string; name: string; slug: string };
        await prisma.organization.upsert({
          where: { clerkOrgId: data.id },
          create: { name: data.name, slug: data.slug, clerkOrgId: data.id },
          update: { name: data.name },
        });
        logger.info({ orgId: data.id }, "Organization synced from Clerk");
      }

      res.json({ received: true });
    } catch (err) {
      logger.error({ err }, "Clerk webhook error");
      res.status(400).json({ error: "Webhook verification failed" });
    }
  },
);

// Avoid circular import — import express inside the file
import express from "express";
