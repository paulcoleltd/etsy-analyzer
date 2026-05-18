import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { EtsyModule } from './etsy/etsy.module'
import { ApiKeysModule } from './api-keys/api-keys.module'
import { HealthModule } from './health/health.module'
import { BillingModule } from './billing/billing.module'
import { IpRateLimitMiddleware } from './common/middleware/ip-rate-limit.middleware'
import { RequestIdMiddleware } from './common/middleware/request-id.middleware'

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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, IpRateLimitMiddleware).forRoutes('*')
  }
}
