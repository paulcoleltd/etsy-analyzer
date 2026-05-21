FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY services/ ./services/

RUN echo 'shamefully-hoist=true' >> .npmrc && pnpm install --frozen-lockfile

RUN pnpm --filter @etsy-analyzer/types build
RUN pnpm --filter @etsy-analyzer/config build
RUN pnpm --filter @etsy-analyzer/db build
RUN pnpm --filter @etsy-analyzer/notification-service build

# ── Runtime stage ──────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm@10

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/tsconfig.base.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/services/notification-service/ ./services/notification-service/
COPY --from=builder /app/node_modules/ ./node_modules/

WORKDIR /app/services/notification-service
EXPOSE 3003
CMD ["node", "dist/main.js"]
