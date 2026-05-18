import { Injectable, Logger } from '@nestjs/common'
import { getDb, shopSnapshots } from '@etsy-analyzer/db'
import { eq, desc } from 'drizzle-orm'

export interface ShopSnapshotData {
  listingCount: number
  totalSalesEst: number | null
  listings: ListingSnapshot[]
}

export interface ListingSnapshot {
  listingId: string
  title: string | null
  priceUsd: number | null
  numReviews: number
  isBestseller: boolean
}

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name)
  private db = getDb()

  /** Fetch latest snapshot for a shop. */
  async getLatest(etsyShopId: string): Promise<ShopSnapshotData | null> {
    const snap = await this.db.query.shopSnapshots.findFirst({
      where: eq(shopSnapshots.etsyShopId, etsyShopId),
      orderBy: [desc(shopSnapshots.takenAt)],
    })
    if (!snap?.snapshotData) return null
    return snap.snapshotData as ShopSnapshotData
  }

  /** Fetch second-most-recent snapshot (used for diff). */
  async getPrevious(etsyShopId: string): Promise<ShopSnapshotData | null> {
    const snaps = await this.db.query.shopSnapshots.findMany({
      where: eq(shopSnapshots.etsyShopId, etsyShopId),
      orderBy: [desc(shopSnapshots.takenAt)],
      limit: 2,
    })
    if (snaps.length < 2 || !snaps[1].snapshotData) return null
    return snaps[1].snapshotData as ShopSnapshotData
  }

  /** Persist a new snapshot. Called after each scrape. */
  async saveSnapshot(
    etsyShopId: string,
    data: ShopSnapshotData,
  ): Promise<void> {
    await this.db.insert(shopSnapshots).values({
      etsyShopId,
      listingCount: data.listingCount,
      totalSalesEst: data.totalSalesEst ?? null,
      snapshotData: data,
    })
    this.logger.log(`Snapshot saved for shop ${etsyShopId} (${data.listingCount} listings)`)
  }

  /** Build a ShopSnapshotData from raw research-service response. */
  static fromResearchData(raw: Record<string, unknown>): ShopSnapshotData {
    const topListings = (raw['top_listings'] as Array<Record<string, unknown>> | undefined) ?? []
    return {
      listingCount: Number(raw['listing_count'] ?? topListings.length),
      totalSalesEst: raw['est_monthly_revenue'] != null
        ? Number(raw['est_monthly_revenue'])
        : null,
      listings: topListings.map((l) => ({
        listingId: String(l['etsy_listing_id'] ?? ''),
        title: (l['title'] as string | null) ?? null,
        priceUsd: l['price_usd'] != null ? Number(l['price_usd']) : null,
        numReviews: Number(l['num_reviews'] ?? 0),
        isBestseller: Boolean(l['is_bestseller']),
      })),
    }
  }
}
