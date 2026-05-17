import { Controller, Get } from '@nestjs/common'
import { Public } from '../common/decorators/public.decorator'
import type { HealthResponse } from '@etsy-analyzer/types'

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health(): HealthResponse {
    return {
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    }
  }
}
