import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { EtsyModule } from './etsy/etsy.module'
import { ApiKeysModule } from './api-keys/api-keys.module'
import { HealthModule } from './health/health.module'
import { BillingModule } from './billing/billing.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    EtsyModule,
    ApiKeysModule,
    HealthModule,
    BillingModule,
  ],
})
export class AppModule {}
