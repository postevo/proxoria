import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { prisma } from "../lib/db.js";
import { AuthError, ForbiddenError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

declare global {
  namespace Express {
    interface Request {
      orgId: string;
      apiKeyId: string;
      userId?: string;
    }
  }
}

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
      include: { org: { select: { id: true, plan: true } } },
    });

    if (!apiKey || apiKey.revokedAt) {
      return next(new AuthError("Invalid or revoked API key"));
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return next(new AuthError("API key expired"));
    }

    req.orgId = apiKey.orgId;
    req.apiKeyId = apiKey.id;

    // Update lastUsedAt async — don't await
    prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch((e) => logger.warn({ err: e }, "Failed to update key lastUsedAt"));

    next();
  } catch (err) {
    logger.error({ err }, "Auth middleware error");
    next(err);
  }
}
