FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY services/competitor-service/ ./services/competitor-service/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @etsy-analyzer/types build
RUN pnpm --filter @etsy-analyzer/config build
RUN pnpm --filter @etsy-analyzer/db build
RUN pnpm --filter @etsy-analyzer/competitor-service build

# ── Runtime stage ──────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm@10

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/competitor-service/ ./services/competitor-service/
COPY --from=builder /app/node_modules/ ./node_modules/

WORKDIR /app/services/competitor-service
EXPOSE 3002
CMD ["node", "dist/main.js"]
