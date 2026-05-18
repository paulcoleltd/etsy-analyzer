import {
  Controller, Get, Post, Body, Headers, RawBodyRequest,
  Req, UseGuards, HttpCode, HttpStatus, Request,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { BillingService } from './billing.service'
import { JwtAuthGuard } from '../common/jwt-auth.guard'

class CheckoutDto {
  @IsString() priceId!: string
}

@ApiTags('billing')
@Controller('v1/billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('checkout')
  checkout(@Request() req: any, @Body() dto: CheckoutDto) {
    return this.billing.createCheckoutSession(req.user.sub, dto.priceId)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('portal')
  portal(@Request() req: any) {
    return this.billing.createBillingPortalSession(req.user.sub)
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('subscription')
  subscription(@Request() req: any) {
    return this.billing.getSubscription(req.user.sub)
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.billing.handleWebhookEvent(req.rawBody!, sig)
  }
}
