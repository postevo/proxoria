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
