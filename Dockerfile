# ─── Stage 1: Install all dependencies ───────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Generate Prisma client for Alpine Linux
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Compile packages in dependency order
RUN cd packages/shared && npx tsc
RUN cd packages/database && npx tsc

# Patch database package.json so Node can resolve the compiled output at runtime
RUN node -e " \
  const p = require('./packages/database/package.json'); \
  p.main = './dist/index.js'; \
  p.exports = { '.': './dist/index.js' }; \
  require('fs').writeFileSync('./packages/database/package.json', JSON.stringify(p, null, 2)); \
"

RUN cd apps/api && npx tsc

# ─── Stage 3: Production runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# openssl required by Prisma query engine on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm ci --omit=dev

# Overwrite database package.json with the patched version (main → dist)
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json

# Copy compiled package artifacts
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy generated Prisma query engine binaries
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
