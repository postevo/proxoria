// LLM Provider types
export type LLMProvider = "anthropic" | "openai" | "google";

export interface GatewayRequest {
  provider: LLMProvider;
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  systemPrompt?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GatewayResponse {
  id: string;
  provider: LLMProvider;
  model: string;
  content: string;
  usage: TokenUsage;
  latencyMs: number;
  costUsd: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Cost table (USD per 1M tokens) - updated June 2026
export const COST_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  // Anthropic
  "claude-opus-4-8": { input: 15.0, output: 75.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4.0 },
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  // Google
  "gemini-1.5-pro": { input: 1.25, output: 5.0 },
  "gemini-1.5-flash": { input: 0.075, output: 0.30 },
  "gemini-2.0-flash": { input: 0.075, output: 0.30 },
};

export function calculateCost(model: string, usage: TokenUsage): number {
  const rates = COST_PER_MILLION_TOKENS[model];
  if (!rates) return 0;
  const inputCost = (usage.promptTokens / 1_000_000) * rates.input;
  const outputCost = (usage.completionTokens / 1_000_000) * rates.output;
  return inputCost + outputCost;
}

// API response types
export interface ApiError {
  error: string;
  code: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
