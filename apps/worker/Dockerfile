# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace manifests for dependency caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json ./packages/config/
COPY packages/domain/package.json ./packages/domain/
COPY apps/worker/package.json ./apps/worker/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/config/ ./packages/config/
COPY packages/domain/ ./packages/domain/
COPY apps/worker/ ./apps/worker/

# Build domain package first (worker depends on it)
RUN pnpm --filter @agentforge/domain build

# Build worker
RUN pnpm --filter @agentforge/worker build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json ./packages/config/
COPY packages/domain/package.json ./packages/domain/
COPY apps/worker/package.json ./apps/worker/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/packages/domain/dist ./packages/domain/dist
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

WORKDIR /app/apps/worker

ENV NODE_ENV=production
ENV AI_PROVIDER=mock
ENV LOG_LEVEL=info

CMD ["node", "dist/index.js"]
