import { Controller, Get, Delete, Query, Redirect, HttpCode, HttpStatus, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { EtsyOAuthService } from './etsy-oauth.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { JwtPayload } from '@etsy-analyzer/types'

@ApiTags('etsy')
@Controller('auth/etsy')
@UseGuards(JwtAuthGuard)
export class EtsyController {
  constructor(private etsyOAuth: EtsyOAuthService) {}

  @ApiBearerAuth()
  @Get('connect')
  @Redirect()
  connect(@CurrentUser() user: JwtPayload) {
    const url = this.etsyOAuth.getAuthUrl(user.sub)
    return { url }
  }

  @Get('callback')
  @Redirect()
  async callback(@Query('code') code: string, @Query('state') state: string) {
    await this.etsyOAuth.handleCallback(code, state)
    return { url: `${process.env.NEXTAUTH_URL}/settings?etsy=connected` }
  }

  @ApiBearerAuth()
  @Delete('disconnect')
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect(@CurrentUser() user: JwtPayload) {
    return this.etsyOAuth.disconnect(user.sub)
  }
}
