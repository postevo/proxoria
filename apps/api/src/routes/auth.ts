import express, { Router, Request, Response } from "express";
import { Webhook } from "svix";
import { prisma } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { sendWelcomeEmail, sendActivationEmail } from "../services/email.service.js";

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
        case "user.created": {
          const d = event.data as {
            id: string;
            first_name?: string;
            email_addresses: { email_address: string; primary: boolean }[];
          };
          const primaryEmail = d.email_addresses.find((e) => e.primary)?.email_address
            ?? d.email_addresses[0]?.email_address;
          if (primaryEmail) {
            sendWelcomeEmail(primaryEmail, d.first_name).catch((err) =>
              logger.error({ err }, "Failed to queue welcome email"),
            );
          }
          logger.info({ clerkUserId: d.id }, "User created — welcome email queued");
          break;
        }

        case "organization.created": {
          const d = event.data as {
            id: string;
            name: string;
            slug: string;
            created_by?: string;
          };
          await prisma.organization.upsert({
            where: { clerkOrgId: d.id },
            create: { name: d.name, slug: d.slug, clerkOrgId: d.id },
            update: { name: d.name },
          });
          logger.info({ clerkOrgId: d.id }, "Organization synced");

          // Send activation email to the org creator
          if (d.created_by) {
            try {
              const { clerkClient } = await import("@clerk/clerk-sdk-node");
              const user = await clerkClient.users.getUser(d.created_by);
              const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
                ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
              if (email) {
                sendActivationEmail(email, d.name).catch((err) =>
                  logger.error({ err }, "Failed to queue activation email"),
                );
              }
            } catch (err) {
              logger.warn({ err }, "Could not fetch org creator for activation email");
            }
          }
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
