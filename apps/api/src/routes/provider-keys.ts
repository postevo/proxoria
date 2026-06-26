import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { encrypt } from "../lib/encryption.js";
import { NotFoundError } from "../lib/errors.js";

export const providerKeysRouter = Router();

const UpsertProviderKeySchema = z.object({
  key: z.string().min(1, "Provider API key is required"),
  label: z.string().max(100).optional(),
});

const VALID_PROVIDERS = ["ANTHROPIC", "OPENAI", "GOOGLE"] as const;
type ProviderParam = (typeof VALID_PROVIDERS)[number];

function validateProvider(raw: string): ProviderParam {
  const upper = raw.toUpperCase() as ProviderParam;
  if (!VALID_PROVIDERS.includes(upper)) {
    throw new Error(`Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}`);
  }
  return upper;
}

// GET /v1/provider-keys — list configured providers (keys never returned)
providerKeysRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await prisma.providerKey.findMany({
      where: { orgId: req.orgId, isActive: true },
      select: {
        id: true,
        provider: true,
        label: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { provider: "asc" },
    });
    res.json(keys);
  } catch (err) {
    next(err);
  }
});

// PUT /v1/provider-keys/:provider — upsert a provider key
providerKeysRouter.put("/:provider", async (req: Request, res: Response, next: NextFunction) => {
  let provider: ProviderParam;
  try {
    provider = validateProvider(req.params.provider);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
    return;
  }

  const parsed = UpsertProviderKeySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  try {
    const { encrypted, iv, tag } = encrypt(parsed.data.key);

    const record = await prisma.providerKey.upsert({
      where: { orgId_provider: { orgId: req.orgId, provider } },
      create: {
        orgId: req.orgId,
        provider,
        encryptedKey: encrypted,
        iv,
        tag,
        label: parsed.data.label,
        isActive: true,
      },
      update: {
        encryptedKey: encrypted,
        iv,
        tag,
        label: parsed.data.label,
        isActive: true,
      },
      select: {
        id: true,
        provider: true,
        label: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: req.orgId,
        actorId: req.userId ?? req.apiKeyId ?? "unknown",
        actorType: req.userId ? "user" : "api_key",
        action: "provider_key.upserted",
        targetId: record.id,
        targetType: "provider_key",
        metadata: { provider },
      },
    });

    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
});

// DELETE /v1/provider-keys/:provider — deactivate a provider key
providerKeysRouter.delete("/:provider", async (req: Request, res: Response, next: NextFunction) => {
  let provider: ProviderParam;
  try {
    provider = validateProvider(req.params.provider);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
    return;
  }

  try {
    const existing = await prisma.providerKey.findUnique({
      where: { orgId_provider: { orgId: req.orgId, provider } },
    });
    if (!existing) throw new NotFoundError(`Provider key for ${provider}`);

    await prisma.providerKey.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        orgId: req.orgId,
        actorId: req.userId ?? req.apiKeyId ?? "unknown",
        actorType: req.userId ? "user" : "api_key",
        action: "provider_key.deleted",
        targetId: existing.id,
        targetType: "provider_key",
        metadata: { provider },
      },
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
