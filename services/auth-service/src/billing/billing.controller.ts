import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsageMeteringService } from '../common/usage-metering.service'
import { getDb, users } from '@etsy-analyzer/db'
import { eq } from 'drizzle-orm'
import type { JwtPayload } from '@etsy-analyzer/types'

@ApiTags('billing')
@Controller('v1/billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  private db = getDb()
  constructor(private metering: UsageMeteringService) {}

  @Get('usage')
  async getUsage(@CurrentUser() user: JwtPayload) {
    const dbUser = await this.db.query.users.findFirst({ where: eq(users.id, user.sub) })
    const plan = dbUser?.plan ?? 'free'
    const stats = await this.metering.getUsageStats(user.sub, plan)
    return {
      plan,
      planStatus: dbUser?.planStatus ?? 'active',
      planExpiresAt: dbUser?.planExpiresAt?.toISOString() ?? null,
      usage: stats,
    }
  }
}
