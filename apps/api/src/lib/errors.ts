export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(404, "NOT_FOUND", `${resource} not found`);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super(429, "RATE_LIMITED", "Rate limit exceeded");
  }
}

export class BudgetExceededError extends AppError {
  constructor() {
    super(402, "BUDGET_EXCEEDED", "Organization or project budget exceeded");
  }
}

export class ProviderKeyNotConfiguredError extends AppError {
  constructor(provider: string) {
    super(400, "PROVIDER_KEY_NOT_CONFIGURED", `No API key configured for provider: ${provider}. Store your key via POST /v1/provider-keys.`);
  }
}

export class ProviderError extends AppError {
  constructor(provider: string, message: string, statusCode = 502) {
    super(statusCode, "PROVIDER_ERROR", `${provider} API error: ${message}`);
  }
}

export class SubscriptionSuspendedError extends AppError {
  constructor() {
    super(402, "SUBSCRIPTION_SUSPENDED", "API access suspended due to a failed payment. Update your payment method at the billing dashboard.");
  }
}
