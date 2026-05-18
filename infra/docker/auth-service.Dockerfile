FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY packages/db ./packages/db
COPY services/auth-service ./services/auth-service

RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile && \
    pnpm --filter @etsy-analyzer/types build && \
    pnpm --filter @etsy-analyzer/config build && \
    pnpm --filter @etsy-analyzer/db build && \
    pnpm --filter @etsy-analyzer/auth-service build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/config/package.json ./packages/config/package.json
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/package.json ./services/auth-service/package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "services/auth-service/dist/main.js"]
