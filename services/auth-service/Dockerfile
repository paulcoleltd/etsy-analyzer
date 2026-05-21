FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10

# Copy full monorepo so pnpm can resolve all workspace deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY services/ ./services/

# Install all workspace deps (needed so drizzle-orm & express resolve correctly)
RUN echo 'shamefully-hoist=true' >> .npmrc && pnpm install --frozen-lockfile

# Build shared packages then auth-service
RUN pnpm --filter @etsy-analyzer/types build
RUN pnpm --filter @etsy-analyzer/config build
RUN pnpm --filter @etsy-analyzer/db build
RUN pnpm --filter @etsy-analyzer/auth-service build

# ── Runtime stage ──────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm@10

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/tsconfig.base.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/auth-service/ ./services/auth-service/
COPY --from=builder /app/node_modules/ ./node_modules/

WORKDIR /app/services/auth-service
EXPOSE 3001
CMD ["node", "dist/main.js"]
