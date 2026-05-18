import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: unknown }>()
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException()
    try {
      const payload = JSON.parse(Buffer.from(auth.slice(7).split('.')[1], 'base64url').toString())
      if (!payload?.sub) throw new UnauthorizedException()
      const exp = payload.exp as number | undefined
      if (exp && exp < Math.floor(Date.now() / 1000)) throw new UnauthorizedException('Token expired')
      req.user = payload
      return true
    } catch { throw new UnauthorizedException('Invalid token') }
  }
}
