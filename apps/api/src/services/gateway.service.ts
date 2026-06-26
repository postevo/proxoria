import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GatewayRequest, GatewayResponse, calculateCost, TokenUsage } from "@ai-gateway/shared";
import { prisma } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { decrypt } from "../lib/encryption.js";
import {
  BudgetExceededError,
  ProviderKeyNotConfiguredError,
  ProviderError,
} from "../lib/errors.js";
import { reportUsageOverage } from "./billing.service.js";

async function getDecryptedProviderKey(orgId: string, provider: string): Promise<string> {
  const dbProvider = provider.toUpperCase() as "ANTHROPIC" | "OPENAI" | "GOOGLE";
  const record = await prisma.providerKey.findUnique({
    where: { orgId_provider: { orgId, provider: dbProvider } },
  });

  if (!record || !record.isActive) {
    throw new ProviderKeyNotConfiguredError(provider);
  }

  return decrypt(record.encryptedKey, record.iv, record.tag);
}

export async function routeRequest(
  req: GatewayRequest,
  orgId: string,
  projectId: string | undefined,
  apiKeyId: string,
): Promise<GatewayResponse> {
  await checkBudget(orgId, projectId);

  const start = Date.now();
  let response: GatewayResponse;

  if (req.provider === "anthropic") {
    response = await callAnthropic(req, orgId, start);
  } else if (req.provider === "openai") {
    response = await callOpenAI(req, orgId, start);
  } else if (req.provider === "google") {
    response = await callGoogle(req, orgId, start);
  } else {
    throw new Error(`Unsupported provider: ${req.provider}`);
  }

  logUsage(orgId, projectId, apiKeyId, req, response, 200).catch((e) =>
    logger.error({ err: e }, "Failed to log usage"),
  );

  // Report metered token usage to Stripe for overage billing (fire-and-forget)
  reportUsageOverage(orgId, response.usage.totalTokens).catch((e) =>
    logger.warn({ err: e }, "Failed to report usage overage to Stripe"),
  );

  return response;
}

async function callAnthropic(req: GatewayRequest, orgId: string, start: number): Promise<GatewayResponse> {
  const apiKey = await getDecryptedProviderKey(orgId, "anthropic");
  const client = new Anthropic({ apiKey });

  const messages = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  try {
    const res = await client.messages.create({
      model: req.model || "claude-sonnet-4-6",
      max_tokens: req.maxTokens || 4096,
      messages,
      ...(req.systemPrompt && { system: req.systemPrompt }),
      ...(req.temperature !== undefined && { temperature: req.temperature }),
    });

    const usage: TokenUsage = {
      promptTokens: res.usage.input_tokens,
      completionTokens: res.usage.output_tokens,
      totalTokens: res.usage.input_tokens + res.usage.output_tokens,
    };
    const content = res.content[0]?.type === "text" ? res.content[0].text : "";

    return {
      id: res.id,
      provider: "anthropic",
      model: res.model,
      content,
      usage,
      latencyMs: Date.now() - start,
      costUsd: calculateCost(res.model, usage),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = (err as { status?: number }).status;
    throw new ProviderError("Anthropic", msg, status === 429 ? 429 : 502);
  }
}

async function callOpenAI(req: GatewayRequest, orgId: string, start: number): Promise<GatewayResponse> {
  const apiKey = await getDecryptedProviderKey(orgId, "openai");
  const client = new OpenAI({ apiKey });

  const messages: OpenAI.ChatCompletionMessageParam[] = [];
  if (req.systemPrompt) messages.push({ role: "system", content: req.systemPrompt });
  for (const m of req.messages) {
    messages.push({ role: m.role as "user" | "assistant", content: m.content });
  }

  try {
    const res = await client.chat.completions.create({
      model: req.model || "gpt-4o",
      messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
    });

    const usage: TokenUsage = {
      promptTokens: res.usage?.prompt_tokens || 0,
      completionTokens: res.usage?.completion_tokens || 0,
      totalTokens: res.usage?.total_tokens || 0,
    };

    return {
      id: res.id,
      provider: "openai",
      model: res.model,
      content: res.choices[0]?.message.content || "",
      usage,
      latencyMs: Date.now() - start,
      costUsd: calculateCost(res.model, usage),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = (err as { status?: number }).status;
    throw new ProviderError("OpenAI", msg, status === 429 ? 429 : 502);
  }
}

async function callGoogle(req: GatewayRequest, orgId: string, start: number): Promise<GatewayResponse> {
  const apiKey = await getDecryptedProviderKey(orgId, "google");
  const googleAI = new GoogleGenerativeAI(apiKey);
  const modelId = req.model || "gemini-1.5-flash";
  const model = googleAI.getGenerativeModel({ model: modelId });

  const history = req.messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const lastMessage = req.messages[req.messages.length - 1];

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();
    const meta = result.response.usageMetadata;

    const usage: TokenUsage = {
      promptTokens: meta?.promptTokenCount || 0,
      completionTokens: meta?.candidatesTokenCount || 0,
      totalTokens: meta?.totalTokenCount || 0,
    };

    return {
      id: `google-${Date.now()}`,
      provider: "google",
      model: modelId,
      content: text,
      usage,
      latencyMs: Date.now() - start,
      costUsd: calculateCost(modelId, usage),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    throw new ProviderError("Google", msg);
  }
}

async function checkBudget(orgId: string, projectId?: string): Promise<void> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [org, monthSpend] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { monthlyBudget: true },
    }),
    prisma.usageLog.aggregate({
      where: {
        orgId,
        ...(projectId && { projectId }),
        createdAt: { gte: startOfMonth },
      },
      _sum: { costUsd: true },
    }),
  ]);

  const spent = Number(monthSpend._sum.costUsd || 0);
  const budget = Number(org?.monthlyBudget || 0);
  if (budget > 0 && spent >= budget) {
    throw new BudgetExceededError();
  }
}

async function logUsage(
  orgId: string,
  projectId: string | undefined,
  apiKeyId: string,
  req: GatewayRequest,
  res: GatewayResponse,
  statusCode: number,
): Promise<void> {
  await prisma.usageLog.create({
    data: {
      orgId,
      projectId,
      apiKeyId,
      provider: req.provider.toUpperCase() as "ANTHROPIC" | "OPENAI" | "GOOGLE",
      model: res.model,
      promptTokens: res.usage.promptTokens,
      completionTokens: res.usage.completionTokens,
      totalTokens: res.usage.totalTokens,
      costUsd: res.costUsd,
      latencyMs: res.latencyMs,
      statusCode,
      requestId: res.id,
    },
  });
}
