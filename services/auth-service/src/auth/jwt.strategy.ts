import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { JwtPayload } from '@etsy-analyzer/types'
import { RedisService } from '../common/redis.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private redis: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? '',
      passReqToCallback: false,
    })
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const blacklisted = await this.redis.get(`jwt:blacklist:${payload.jti}`)
    if (blacklisted) throw new UnauthorizedException('Token has been revoked')
    return payload
  }
}
