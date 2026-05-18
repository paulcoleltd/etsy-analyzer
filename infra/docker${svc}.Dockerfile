FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY packages/db ./packages/db
COPY services/notification-service ./services/notification-service
RUN corepack enable pnpm && pnpm install --frozen-lockfile &&     pnpm --filter @etsy-analyzer/types build &&     pnpm --filter @etsy-analyzer/config build &&     pnpm --filter @etsy-analyzer/db build &&     pnpm --filter @etsy-analyzer/notification-service build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/package.json
EXPOSE 3000
CMD ["node", "services/notification-service/dist/main.js"]
