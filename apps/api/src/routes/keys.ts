import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { prisma } from "../lib/db.js";
import { NotFoundError, ForbiddenError } from "../lib/errors.js";

export const keysRouter = Router();

const CreateKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).optional().default(["gateway:read", "usage:read"]),
  expiresAt: z.string().datetime().optional(),
});

// GET /v1/keys
keysRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { orgId: req.orgId, revokedAt: null },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(keys);
  } catch (err) {
    next(err);
  }
});

// POST /v1/keys
keysRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = CreateKeySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  try {
    const rawKey = `ak_live_${randomBytes(32).toString("base64url")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 12);

    const key = await prisma.apiKey.create({
      data: {
        orgId: req.orgId,
        name: parsed.data.name,
        keyHash,
        keyPrefix,
        scopes: parsed.data.scopes,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
        createdByUserId: req.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: req.orgId,
        actorId: req.userId ?? req.apiKeyId ?? "unknown",
        actorType: req.userId ? "user" : "api_key",
        action: "api_key.created",
        targetId: key.id,
        targetType: "api_key",
      },
    });

    // Return raw key ONCE — never stored
    res.status(201).json({
      id: key.id,
      name: key.name,
      key: rawKey,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      createdAt: key.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /v1/keys/:id - revoke
keysRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
    if (!key || key.orgId !== req.orgId) throw new NotFoundError("API key");

    await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { revokedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        orgId: req.orgId,
        actorId: req.userId ?? req.apiKeyId ?? "unknown",
        actorType: req.userId ? "user" : "api_key",
        action: "api_key.revoked",
        targetId: key.id,
        targetType: "api_key",
      },
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
