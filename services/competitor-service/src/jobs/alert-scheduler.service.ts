import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { AlertProcessor } from '../alerts/alert.processor'
import { TrackerService } from '../tracker/tracker.service'

@Injectable()
export class AlertSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(AlertSchedulerService.name)

  constructor(
    private alertProcessor: AlertProcessor,
    private tracker: TrackerService,
  ) {}

  async onModuleInit() {
    this.logger.log('Alert scheduler initialised')
  }

  /** Run every 4 hours, staggered across the hour to avoid thundering herd. */
  @Cron('0 */4 * * *')
  async runScheduledChecks() {
    const shops = await this.tracker.getAllTrackedShopIds()
    this.logger.log(`Scheduling checks for ${shops.length} tracked shops`)

    for (let i = 0; i < shops.length; i++) {
      const { etsyShopId } = shops[i]
      // Stagger: 10 seconds between each shop check
      setTimeout(() => {
        this.alertProcessor.checkShop(etsyShopId).catch((err) =>
          this.logger.error(`Check failed for ${etsyShopId}: ${String(err)}`),
        )
      }, i * 10_000)
    }
  }

  /** Immediately check a newly added shop. */
  async checkShopNow(etsyShopId: string) {
    return this.alertProcessor.checkShop(etsyShopId)
  }
}
