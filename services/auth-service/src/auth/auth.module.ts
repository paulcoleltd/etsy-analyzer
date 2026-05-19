import { Module, Global } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { APP_GUARD } from '@nestjs/core'
import { AuthController } from './auth.controller'
import { DevVerifyController } from './dev-verify.controller'
import { AuthService } from './auth.service'
import { EmailService } from './email.service'
import { JwtStrategy } from './jwt.strategy'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RedisService } from '../common/redis.service'

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, DevVerifyController],
  providers: [
    AuthService,
    EmailService,
    JwtStrategy,
    RedisService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, RedisService, JwtModule],
})
export class AuthModule {}
