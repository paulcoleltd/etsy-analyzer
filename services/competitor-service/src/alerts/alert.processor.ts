import { Injectable, Logger } from '@nestjs/common'
import { getDb, trackedShops, notifications } from '@etsy-analyzer/db'
import { eq } from 'drizzle-orm'
import type { ShopDiff, ShopAlertConfig } from '@etsy-analyzer/types'
import { SnapshotService } from '../snapshot/snapshot.service'
import { DiffService } from '../diff/diff.service'
import { RedisService } from '../common/redis.service'

const RESEARCH_URL = process.env.RESEARCH_SERVICE_URL ?? 'http://localhost:8002'

@Injectable()
export class AlertProcessor {
  private readonly logger = new Logger(AlertProcessor.name)
  private db = getDb()

  constructor(
    private snapshot: SnapshotService,
    private diff: DiffService,
    private redis: RedisService,
  ) {}

  async checkShop(etsyShopId: string): Promise<void> {
    this.logger.log(`Checking shop ${etsyShopId}`)

    // 1. Fetch current shop data from research service
    let currentData: Record<string, unknown>
    try {
      const resp = await fetch(`${RESEARCH_URL}/v1/research/shop/${etsyShopId}`)
      if (!resp.ok) {
        this.logger.warn(`Research service returned ${resp.status} for shop ${etsyShopId}`)
        return
      }
      currentData = await resp.json() as Record<string, unknown>
    } catch (err) {
      this.logger.error(`Failed to fetch shop ${etsyShopId}: ${String(err)}`)
      return
    }

    // 2. Build current snapshot
    const currentSnap = SnapshotService.fromResearchData(currentData)
    const previousSnap = await this.snapshot.getLatest(etsyShopId)

    // 3. Compute diff (only if we have a previous snapshot)
    if (previousSnap) {
      const shopDiff = this.diff.computeDiff(currentSnap, previousSnap)

      if (this.diff.hasMeaningfulChanges(shopDiff)) {
        // 4. Find all users tracking this shop and create notifications
        const trackers = await this.db.query.trackedShops.findMany({
          where: eq(trackedShops.etsyShopId, etsyShopId),
        })
        await Promise.all(
          trackers.map((tracker) =>
            this._notifyUser(tracker.userId, etsyShopId, shopDiff, tracker.alertConfig as ShopAlertConfig),
          ),
        )
      }
    }

    // 5. Save new snapshot
    await this.snapshot.saveSnapshot(etsyShopId, currentSnap)

    // 6. Update last_checked
    await this.db
      .update(trackedShops)
      .set({ lastChecked: new Date() })
      .where(eq(trackedShops.etsyShopId, etsyShopId))
  }

  private async _notifyUser(
    userId: string,
    etsyShopId: string,
    diff: ShopDiff,
    config: ShopAlertConfig,
  ): Promise<void> {
    const notifs: Array<{ type: string; title: string; body: string; metadata: unknown }> = []

    if (config.newListing && diff.newListings.length > 0) {
      notifs.push({
        type: 'new_listing',
        title: `${etsyShopId} added ${diff.newListings.length} new listing${diff.newListings.length > 1 ? 's' : ''}`,
        body: `New listings: ${diff.newListings.slice(0, 3).join(', ')}${diff.newListings.length > 3 ? ` +${diff.newListings.length - 3} more` : ''}`,
        metadata: { shopId: etsyShopId, listingIds: diff.newListings },
      })
    }

    if (config.priceChange && diff.priceChanges.length > 0) {
      for (const change of diff.priceChanges.slice(0, 3)) {
        notifs.push({
          type: 'price_change',
          title: `${etsyShopId} changed a price`,
          body: `Listing ${change.listingId}: $${change.oldPrice} → $${change.newPrice} (${change.changePct > 0 ? '+' : ''}${change.changePct}%)`,
          metadata: { shopId: etsyShopId, change },
        })
      }
    }

    if (config.reviewMilestone && diff.reviewMilestones.length > 0) {
      for (const m of diff.reviewMilestones) {
        notifs.push({
          type: 'review_milestone',
          title: `${etsyShopId} hit ${m.milestone} reviews`,
          body: `Listing ${m.listingId} reached ${m.milestone} reviews`,
          metadata: { shopId: etsyShopId, ...m },
        })
      }
    }

    // Save in-app notifications to PostgreSQL
    for (const n of notifs) {
      if (!config.channels.includes('in_app')) continue
      await this.db.insert(notifications).values({
        userId,
        type: n.type,
        title: n.title,
        body: n.body,
        metadata: n.metadata,
      })
    }

    // Publish to Redis pub/sub for WebSocket delivery
    if (notifs.length > 0) {
      await this.redis.publish(
        `notifications:${userId}`,
        JSON.stringify({ type: 'competitor_alert', count: notifs.length, shopId: etsyShopId }),
      )

      // Queue email notifications if channel enabled
      if (config.channels.includes('email')) {
        await this.redis.set(
          `notify:email:${userId}:${Date.now()}`,
          JSON.stringify({ userId, notifications: notifs }),
          3600,
        )
      }
    }
  }
}
