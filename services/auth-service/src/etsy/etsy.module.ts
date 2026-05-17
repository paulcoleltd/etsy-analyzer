import { Module } from '@nestjs/common'
import { EtsyController } from './etsy.controller'
import { EtsyOAuthService } from './etsy-oauth.service'

@Module({
  controllers: [EtsyController],
  providers: [EtsyOAuthService],
  exports: [EtsyOAuthService],
})
export class EtsyModule {}
