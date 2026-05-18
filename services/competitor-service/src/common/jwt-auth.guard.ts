import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from '@nestjs/common'
import { createHmac } from 'crypto'

// Minimal JWT guard — verifies signature and checks expiry.
// In production, delegate to auth-service's introspect endpoint or use
// the shared JWT_SECRET directly.
function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) return null

    const expected = createHmac('sha256', process.env.JWT_SECRET ?? '')
      .update(`${header}.${payload}`)
      .digest('base64url')
    if (expected !== signature) return null

    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{
      headers: { authorization?: string }
      user?: unknown
    }>()
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException()

    const payload = parseJwt(auth.slice(7))
    if (!payload || !payload['sub']) throw new UnauthorizedException('Invalid token')

    const exp = payload['exp'] as number | undefined
    if (exp && exp < Math.floor(Date.now() / 1000)) throw new UnauthorizedException('Token expired')

    req.user = payload
    return true
  }
}
