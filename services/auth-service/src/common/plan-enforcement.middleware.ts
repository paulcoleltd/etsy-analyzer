import {
  Injectable, NestMiddleware, HttpException, HttpStatus,
} from '@nestjs/common'
import type { Request, Response, NextFunction } from 'express'
import { RedisService } from './redis.service'

type FeatureKey = 'research_searches' | 'grades' | 'keywords' | 'competitors' | 'exports'

// -1 in Redis means unlimited
const PLAN_LIMITS: Record<string, Record<FeatureKey, number>> = {
  free:    { research_searches: 5,   grades: 2,   keywords: 10,  competitors: 0,   exports: 1  },
  starter: { research_searches: 50,  grades: 20,  keywords: 100, competitors: 5,   exports: 10 },
  pro:     { research_searches: 500, grades: 200, keywords: -1,  competitors: 25,  exports: 50 },
  agency:  { research_searches: -1,  grades: -1,  keywords: -1,  competitors: 100, exports: -1 },
}

function featureFromPath(path: string): FeatureKey | null {
  if (path.includes('/research'))   return 'research_searches'
  if (path.includes('/grade'))      return 'grades'
  if (path.includes('/keywords'))   return 'keywords'
  if (path.includes('/competitors')) return 'competitors'
  if (path.includes('/export'))     return 'exports'
  return null
}

@Injectable()
export class PlanEnforcementMiddleware implements NestMiddleware {
  constructor(private redis: RedisService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const user = (req as any).user as { sub?: string; plan?: string } | undefined
    if (!user?.sub || !user?.plan) return next()

    const feature = featureFromPath(req.path)
    if (!feature) return next()

    const plan = user.plan
    const planLimits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
    const limit = planLimits[feature]

    if (limit === -1) return next()  // unlimited

    const today = new Date().toISOString().split('T')[0]
    const key = `rl:${user.sub}:${feature}:${today}`

    const current = await this.redis.incr(key)
    if (current === 1) await this.redis.expire(key, 86400)

    if (current > limit) {
      throw new HttpException(
        {
          error: 'limit_reached',
          feature,
          limit,
          current: current - 1,
          upgrade_url: '/pricing',
          message: `You've reached your daily ${feature.replace(/_/g, ' ')} limit of ${limit}. Upgrade to continue.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    next()
  }
}
