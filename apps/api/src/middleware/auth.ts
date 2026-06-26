import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { prisma } from "../lib/db.js";
import { AuthError, ForbiddenError, SubscriptionSuspendedError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

declare global {
  namespace Express {
    interface Request {
      orgId: string;
      apiKeyId?: string;
      apiKeyScopes?: string[];
      userId?: string;
      orgRole?: string;
    }
  }
}

// ─── API Key Auth (gateway calls) ────────────────────────────────────────────

export async function authenticateApiKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AuthError("Missing Bearer token"));
  }

  const rawKey = authHeader.slice(7);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { org: { select: { id: true, plan: true, subscriptionStatus: true } } },
    });

    if (!apiKey || apiKey.revokedAt) {
      return next(new AuthError("Invalid or revoked API key"));
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return next(new AuthError("API key expired"));
    }

    const suspendedStatuses = ["PAST_DUE", "UNPAID"] as const;
    if (suspendedStatuses.includes(apiKey.org.subscriptionStatus as any)) {
      return next(new SubscriptionSuspendedError());
    }

    req.orgId = apiKey.orgId;
    req.apiKeyId = apiKey.id;
    req.apiKeyScopes = apiKey.scopes;

    prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch((e) => logger.warn({ err: e }, "Failed to update key lastUsedAt"));

    next();
  } catch (err) {
    logger.error({ err }, "API key auth error");
    next(err);
  }
}

// ─── Clerk Session Auth (dashboard calls) ────────────────────────────────────

export const withClerkAuth = ClerkExpressWithAuth();

export async function authenticateClerkUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = (req as any).auth;
  const userId: string | null = auth?.userId ?? null;
  const clerkOrgId: string | null = auth?.orgId ?? null;

  if (!userId) {
    return next(new AuthError("Authentication required"));
  }

  if (!clerkOrgId) {
    return next(new AuthError("No active organization — select an org in the dashboard"));
  }

  try {
    let org = await prisma.organization.findUnique({
      where: { clerkOrgId },
    });

    if (!org) {
      // Race condition: org created in Clerk but webhook not yet processed — auto-provision
      try {
        const clerkRes = await fetch(
          `https://api.clerk.com/v1/organizations/${clerkOrgId}`,
          { headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` } },
        );
        if (!clerkRes.ok) throw new Error(`Clerk API ${clerkRes.status}`);
        const clerkOrg = await clerkRes.json();
        const slug = (clerkOrg.slug ?? clerkOrgId)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .slice(0, 50);
        org = await prisma.organization.upsert({
          where: { clerkOrgId },
          create: { name: clerkOrg.name, slug, clerkOrgId },
          update: {},
        });
        logger.info({ clerkOrgId, orgId: org.id }, "Auto-provisioned org from Clerk");
      } catch (provErr) {
        logger.error({ err: provErr, clerkOrgId }, "Failed to auto-provision org");
        return next(new AuthError("Organization not found — it may not be synced yet"));
      }
    }

    req.orgId = org.id;
    req.userId = userId;
    req.orgRole = auth?.orgRole ?? undefined;

    next();
  } catch (err) {
    logger.error({ err }, "Clerk auth middleware error");
    next(err);
  }
}

// ─── RBAC ─────────────────────────────────────────────────────────────────────

export function requireOrgRole(...allowedClerkRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.orgRole;
    if (!role || !allowedClerkRoles.includes(role)) {
      return next(new ForbiddenError("Insufficient permissions for this action"));
    }
    next();
  };
}

export const requireAdmin = requireOrgRole("org:admin");
export const requireMember = requireOrgRole("org:admin", "org:member");

// ─── API Key Scope Enforcement ────────────────────────────────────────────────

export function requireScope(scope: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const scopes = req.apiKeyScopes;
    if (!scopes || !scopes.includes(scope)) {
      return next(new ForbiddenError(`API key missing required scope: ${scope}`));
    }
    next();
  };
}
