/**
 * DEV-ONLY endpoint — auto-verifies test email addresses.
 * Only active when NODE_ENV=test. Never compiled into production builds.
 *
 * POST /auth/dev/verify-test-user  { email }
 * → marks email_verified=true for any *@etsy-analyzer.test address.
 */
import {
  Controller, Post, Body, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common'
import { IsEmail } from 'class-validator'
import { getDb, users } from '@etsy-analyzer/db'
import { eq } from 'drizzle-orm'
import { Public } from '../common/decorators/public.decorator'

class VerifyTestUserDto {
  @IsEmail() email!: string
}

@Controller('auth/dev')
export class DevVerifyController {
  private db = getDb()

  @Public()
  @Post('verify-test-user')
  @HttpCode(HttpStatus.OK)
  async verifyTestUser(@Body() dto: VerifyTestUserDto) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Not available in production')
    }
    if (!dto.email.endsWith('@etsy-analyzer.test')) {
      throw new ForbiddenException('Only @etsy-analyzer.test addresses allowed')
    }
    await this.db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, dto.email.toLowerCase()))
    return { verified: true }
  }
}
