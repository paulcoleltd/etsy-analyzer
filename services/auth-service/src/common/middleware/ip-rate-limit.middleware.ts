import {
  Injectable, NestMiddleware, HttpException, HttpStatus,
} from '@nestjs/common'
import type { Request, Response, NextFunction } from 'express'
import { RedisService } from '../redis.service'

const WINDOW_SECONDS = 60
const MAX_REQUESTS   = 1000

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.socket.remoteAddress ?? 'unknown'
}

@Injectable()
export class IpRateLimitMiddleware implements NestMiddleware {
  constructor(private redis: RedisService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const ip  = clientIp(req)
    const key = `rl:ip:${ip}:global`

    const current = await this.redis.incr(key)
    if (current === 1) await this.redis.expire(key, WINDOW_SECONDS)

    if (current > MAX_REQUESTS) {
      throw new HttpException(
        {
          error: 'rate_limited',
          message: 'Too many requests — please slow down.',
          retry_after: WINDOW_SECONDS,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    next()
  }
}
