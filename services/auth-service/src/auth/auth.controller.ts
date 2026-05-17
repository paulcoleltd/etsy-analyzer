import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Public } from '../common/decorators/public.decorator'
import type { JwtPayload } from '@etsy-analyzer/types'

class SignupDto {
  @IsEmail() email!: string
  @IsString() @MinLength(8) @MaxLength(128) password!: string
  @IsString() @MinLength(1) @MaxLength(100) name!: string
}

class SigninDto {
  @IsEmail() email!: string
  @IsString() @MinLength(1) password!: string
}

class RefreshDto {
  @IsString() refreshToken!: string
}

class VerifyEmailDto {
  @IsString() token!: string
}

class ForgotPasswordDto {
  @IsEmail() email!: string
}

class ResetPasswordDto {
  @IsString() token!: string
  @IsString() @MinLength(8) @MaxLength(128) newPassword!: string
}

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto)
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() dto: SigninDto) {
    return this.auth.signin(dto.email, dto.password)
  }

  @Post('signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  signout(@CurrentUser() user: JwtPayload) {
    return this.auth.signout(user.sub, user.jti, user.exp)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refreshToken(dto.refreshToken)
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token)
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.requestPasswordReset(dto.email)
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword)
  }

  @ApiBearerAuth()
  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.auth.getMe(user.sub)
  }
}
