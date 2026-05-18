import { Injectable, NestMiddleware } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import type { Request, Response, NextFunction } from 'express'

/** Injects X-Request-ID into every request so errors are traceable. */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const id = (req.headers['x-request-id'] as string | undefined) ?? uuidv4()
    req.headers['x-request-id'] = id
    res.setHeader('x-request-id', id)
    next()
  }
}
