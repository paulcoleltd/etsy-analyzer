import { Module } from '@nestjs/common'
import { BillingController } from './billing.controller'
import { UsageMeteringService } from '../common/usage-metering.service'

@Module({
  controllers: [BillingController],
  providers: [UsageMeteringService],
  exports: [UsageMeteringService],
})
export class BillingModule {}
