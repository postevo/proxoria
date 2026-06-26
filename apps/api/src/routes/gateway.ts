import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { routeRequest } from "../services/gateway.service.js";

export const gatewayRouter = Router();

const GatewayRequestSchema = z.object({
  provider: z.enum(["anthropic", "openai", "google"]),
  model: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ).min(1),
  maxTokens: z.number().int().min(1).max(100_000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  systemPrompt: z.string().optional(),
  projectId: z.string().optional(),
});

// POST /v1/gateway/chat
gatewayRouter.post("/chat", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = GatewayRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  try {
    const result = await routeRequest(
      parsed.data,
      req.orgId,
      parsed.data.projectId,
      req.apiKeyId!,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /v1/gateway/models - list available models
gatewayRouter.get("/models", (_req: Request, res: Response) => {
  res.json({
    models: [
      { provider: "anthropic", id: "claude-opus-4-8", contextWindow: 200000 },
      { provider: "anthropic", id: "claude-sonnet-4-6", contextWindow: 200000 },
      { provider: "anthropic", id: "claude-haiku-4-5-20251001", contextWindow: 200000 },
      { provider: "openai", id: "gpt-4o", contextWindow: 128000 },
      { provider: "openai", id: "gpt-4o-mini", contextWindow: 128000 },
      { provider: "google", id: "gemini-1.5-pro", contextWindow: 1000000 },
      { provider: "google", id: "gemini-1.5-flash", contextWindow: 1000000 },
    ],
  });
});
