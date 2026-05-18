import { Module } from '@nestjs/common'
import { AlertSchedulerService } from './alert-scheduler.service'
import { AlertsModule } from '../alerts/alerts.module'
import { TrackerModule } from '../tracker/tracker.module'

@Module({
  imports: [AlertsModule, TrackerModule],
  providers: [AlertSchedulerService],
  exports: [AlertSchedulerService],
})
export class JobsModule {}
