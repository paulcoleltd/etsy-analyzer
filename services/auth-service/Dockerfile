FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace files needed to resolve packages
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY services/auth-service/ ./services/auth-service/

# Install all deps
RUN pnpm install --frozen-lockfile

# Build shared packages first, then auth-service
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
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/auth-service/ ./services/auth-service/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/services/auth-service/node_modules/ ./services/auth-service/node_modules/ 2>/dev/null || true

WORKDIR /app/services/auth-service
EXPOSE 3001
CMD ["node", "dist/main.js"]
