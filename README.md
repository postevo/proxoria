# Proxoria Platform

Enterprise AI management platform — unified gateway for Claude, GPT-4, and Gemini with cost tracking, budget alerts, and team access controls.

## Stack

- **Backend**: Node.js / TypeScript + Express (`apps/api`)
- **Frontend**: Next.js 14 App Router (`apps/web`)
- **Database**: PostgreSQL + Prisma (`packages/database`)
- **Auth**: Clerk
- **Infra**: Vercel (frontend) + Railway (backend)
- **Billing**: Stripe

## Local Setup

### Prerequisites
- Node.js >= 20
- Docker (for PostgreSQL)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start database
docker-compose up -d postgres

# 3. Set environment variables
cp .env.example .env
# Fill in: DATABASE_URL, CLERK_*, ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_API_KEY

# 4. Run DB migrations
npm run db:migrate

# 5. Generate Prisma client
npm run db:generate

# 6. Start everything
npm run dev
```

The API runs on http://localhost:3001 and the dashboard on http://localhost:3000.

## API Usage

```bash
# Route a request through the gateway
curl -X POST http://localhost:3001/v1/gateway/chat \
  -H "Authorization: Bearer ak_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Architecture

```
apps/
  api/           # Express API + LLM gateway
  web/           # Next.js dashboard
packages/
  database/      # Prisma schema + migrations
  shared/        # Shared TypeScript types + cost tables
.github/
  workflows/     # CI: lint + build + test
```

## Environment Variables

See `.env.example` for the full list. Required for production:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`
- `STRIPE_SECRET_KEY` (for billing)
