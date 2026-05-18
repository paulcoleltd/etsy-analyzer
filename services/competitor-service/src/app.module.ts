import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TrackerModule } from './tracker/tracker.module'
import { SnapshotModule } from './snapshot/snapshot.module'
import { DiffModule } from './diff/diff.module'
import { AlertsModule } from './alerts/alerts.module'
import { JobsModule } from './jobs/jobs.module'
import { RedisService } from './common/redis.service'
import { HealthController } from './health.controller'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TrackerModule,
    SnapshotModule,
    DiffModule,
    AlertsModule,
    JobsModule,
  ],
  providers: [RedisService],
  exports: [RedisService],
  controllers: [HealthController],
})
export class AppModule {}
