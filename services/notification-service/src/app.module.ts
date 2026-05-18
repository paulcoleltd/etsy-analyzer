import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { NotificationsController } from './notifications/notifications.controller'
import { NotificationsService } from './notifications/notifications.service'
import { NotificationsGateway } from './websocket/notifications.gateway'
import { EmailService } from './email/email.service'
import { RedisService } from './common/redis.service'
import { HealthController } from './health.controller'

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [NotificationsController, HealthController],
  providers: [NotificationsService, NotificationsGateway, EmailService, RedisService],
  exports: [RedisService, EmailService],
})
export class AppModule {}
