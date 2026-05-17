import { z } from 'zod'

const portSchema = z.coerce.number().int().min(1).max(65535)

export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
})

export const authEnvSchema = baseEnvSchema.extend({
  PORT: portSchema.default(3001),
  JWT_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),
  ETSY_API_KEY: z.string().min(1),
  ETSY_API_SECRET: z.string().min(1),
  ETSY_REDIRECT_URI: z.string().url(),
  TOKEN_ENCRYPTION_KEY: z.string().length(64), // 32 bytes as hex = 64 chars
  RESEND_API_KEY: z.string().startsWith('re_'),
  FROM_EMAIL: z.string().email(),
})

export const analyticsEnvSchema = baseEnvSchema.extend({
  PORT: portSchema.default(8001),
  ETSY_API_KEY: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z.string().length(64),
  DATABASE_URL_TIMESCALE: z.string().url().optional(),
})

export const researchEnvSchema = baseEnvSchema.extend({
  PORT: portSchema.default(8002),
  ELASTICSEARCH_URL: z.string().url(),
})

export const keywordEnvSchema = baseEnvSchema.extend({
  PORT: portSchema.default(8003),
  ELASTICSEARCH_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
})

export const graderEnvSchema = baseEnvSchema.extend({
  PORT: portSchema.default(8004),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
})

export const webEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  ANALYTICS_SERVICE_URL: z.string().url().default('http://localhost:8001'),
  RESEARCH_SERVICE_URL: z.string().url().default('http://localhost:8002'),
  KEYWORD_SERVICE_URL: z.string().url().default('http://localhost:8003'),
  COMPETITOR_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  GRADER_SERVICE_URL: z.string().url().default('http://localhost:8004'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:3003'),
})

export function validateEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  const result = schema.safeParse(process.env)
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid environment variables:\n${formatted}`)
  }
  return result.data
}
