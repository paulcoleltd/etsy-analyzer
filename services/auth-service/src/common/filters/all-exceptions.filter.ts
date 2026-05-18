import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import type { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp()
    const req      = ctx.getRequest<Request>()
    const res      = ctx.getResponse<Response>()
    const requestId = (req.headers['x-request-id'] as string | undefined) ?? uuidv4()

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    const isClientError = status < 500

    // Only log server errors as errors; client errors are warnings
    if (isClientError) {
      this.logger.warn(`${status} ${req.method} ${req.path}`)
    } else {
      this.logger.error(
        `${status} ${req.method} ${req.path} — ${String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      )
    }

    // Build a clean error body (never expose stack traces)
    let errorBody: Record<string, unknown>

    if (exception instanceof HttpException) {
      const response = exception.getResponse()
      errorBody = typeof response === 'object' && response !== null
        ? { ...(response as object) }
        : { error: 'error', message: String(response) }
    } else {
      errorBody = {
        error:   'internal_server_error',
        message: 'An unexpected error occurred.',
      }
    }

    res.status(status).json({
      ...errorBody,
      request_id: requestId,
      timestamp:  new Date().toISOString(),
    })
  }
}
