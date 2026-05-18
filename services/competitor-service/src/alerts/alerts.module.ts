import { Module } from '@nestjs/common'
import { AlertProcessor } from './alert.processor'
import { SnapshotModule } from '../snapshot/snapshot.module'
import { DiffModule } from '../diff/diff.module'

@Module({
  imports: [SnapshotModule, DiffModule],
  providers: [AlertProcessor],
  exports: [AlertProcessor],
})
export class AlertsModule {}
