import express, { Router, Request, Response } from "express";
import { Webhook } from "svix";
import { prisma } from "../lib/db.js";
import { logger } from "../lib/logger.js";

export const authRouter = Router();

type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

function clerkRoleToOrgRole(clerkRole: string): OrgRole {
  if (clerkRole === "org:admin") return "ADMIN";
  if (clerkRole === "org:member") return "MEMBER";
  if (clerkRole === "org:viewer") return "VIEWER";
  return "MEMBER";
}

// POST /auth/clerk/webhook
authRouter.post(
  "/clerk/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    let event: { type: string; data: Record<string, any> };
    try {
      const wh = new Webhook(secret);
      event = wh.verify(req.body, {
        "svix-id": req.headers["svix-id"] as string,
        "svix-timestamp": req.headers["svix-timestamp"] as string,
        "svix-signature": req.headers["svix-signature"] as string,
      }) as typeof event;
    } catch (err) {
      logger.error({ err }, "Clerk webhook verification failed");
      res.status(400).json({ error: "Webhook verification failed" });
      return;
    }

    try {
      switch (event.type) {
        case "organization.created": {
          const d = event.data as { id: string; name: string; slug: string };
          await prisma.organization.upsert({
            where: { clerkOrgId: d.id },
            create: { name: d.name, slug: d.slug, clerkOrgId: d.id },
            update: { name: d.name },
          });
          logger.info({ clerkOrgId: d.id }, "Organization synced");
          break;
        }

        case "organization.updated": {
          const d = event.data as { id: string; name: string; slug: string };
          await prisma.organization.updateMany({
            where: { clerkOrgId: d.id },
            data: { name: d.name },
          });
          break;
        }

        case "organization.deleted": {
          const d = event.data as { id: string };
          await prisma.organization.deleteMany({ where: { clerkOrgId: d.id } });
          logger.info({ clerkOrgId: d.id }, "Organization deleted");
          break;
        }

        case "organizationMembership.created": {
          const d = event.data as {
            organization: { id: string };
            public_user_data: { user_id: string };
            role: string;
          };
          const org = await prisma.organization.findUnique({
            where: { clerkOrgId: d.organization.id },
          });
          if (org) {
            // First member of a new org is the owner
            const existingCount = await prisma.orgMember.count({ where: { orgId: org.id } });
            const role = existingCount === 0 ? "OWNER" : clerkRoleToOrgRole(d.role);
            await prisma.orgMember.upsert({
              where: { orgId_userId: { orgId: org.id, userId: d.public_user_data.user_id } },
              create: {
                orgId: org.id,
                userId: d.public_user_data.user_id,
                role,
              },
              update: { role },
            });
            logger.info({ orgId: org.id, userId: d.public_user_data.user_id, role }, "Member synced");
          }
          break;
        }

        case "organizationMembership.updated": {
          const d = event.data as {
            organization: { id: string };
            public_user_data: { user_id: string };
            role: string;
          };
          const org = await prisma.organization.findUnique({
            where: { clerkOrgId: d.organization.id },
          });
          if (org) {
            await prisma.orgMember.updateMany({
              where: { orgId: org.id, userId: d.public_user_data.user_id },
              data: { role: clerkRoleToOrgRole(d.role) },
            });
          }
          break;
        }

        case "organizationMembership.deleted": {
          const d = event.data as {
            organization: { id: string };
            public_user_data: { user_id: string };
          };
          const org = await prisma.organization.findUnique({
            where: { clerkOrgId: d.organization.id },
          });
          if (org) {
            await prisma.orgMember.deleteMany({
              where: { orgId: org.id, userId: d.public_user_data.user_id },
            });
            logger.info({ orgId: org.id, userId: d.public_user_data.user_id }, "Member removed");
          }
          break;
        }

        default:
          logger.debug({ type: event.type }, "Unhandled Clerk webhook event");
      }

      res.json({ received: true });
    } catch (err) {
      logger.error({ err, type: event.type }, "Clerk webhook handler error");
      res.status(500).json({ error: "Internal error processing webhook" });
    }
  },
);
