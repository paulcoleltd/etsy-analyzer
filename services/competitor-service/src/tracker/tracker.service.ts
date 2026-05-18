import {
  Injectable, ForbiddenException, ConflictException, NotFoundException,
} from '@nestjs/common'
import { getDb, trackedShops, shopSnapshots } from '@etsy-analyzer/db'
import { eq, and, desc } from 'drizzle-orm'
import type { ShopAlertConfig } from '@etsy-analyzer/types'

const PLAN_LIMITS: Record<string, number> = {
  free: 0, starter: 5, pro: 25, agency: 100,
}

@Injectable()
export class TrackerService {
  private db = getDb()

  async listShops(userId: string) {
    const shops = await this.db.query.trackedShops.findMany({
      where: eq(trackedShops.userId, userId),
      orderBy: [desc(trackedShops.createdAt)],
    })

    // Attach latest snapshot stats for each shop
    const results = await Promise.all(
      shops.map(async (shop) => {
        const snap = await this.db.query.shopSnapshots.findFirst({
          where: eq(shopSnapshots.etsyShopId, shop.etsyShopId),
          orderBy: [desc(shopSnapshots.takenAt)],
        })
        return { ...shop, latestSnapshot: snap ?? null }
      }),
    )
    return results
  }

  async addShop(
    userId: string,
    etsyShopId: string,
    shopName: string,
    plan: string,
  ) {
    const limit = PLAN_LIMITS[plan] ?? 0
    if (limit === 0) {
      throw new ForbiddenException('Competitor tracking requires Starter plan or higher')
    }

    const existing = await this.db.query.trackedShops.findMany({
      where: eq(trackedShops.userId, userId),
    })
    if (existing.length >= limit) {
      throw new ForbiddenException(
        `Your ${plan} plan allows tracking up to ${limit} shops. Upgrade to track more.`,
      )
    }

    const duplicate = existing.find((s) => s.etsyShopId === etsyShopId)
    if (duplicate) throw new ConflictException('You are already tracking this shop')

    const [created] = await this.db
      .insert(trackedShops)
      .values({ userId, etsyShopId, shopName })
      .returning()

    return created
  }

  async removeShop(userId: string, shopId: string) {
    const shop = await this.db.query.trackedShops.findFirst({
      where: and(eq(trackedShops.id, shopId), eq(trackedShops.userId, userId)),
    })
    if (!shop) throw new NotFoundException('Tracked shop not found')
    await this.db.delete(trackedShops).where(eq(trackedShops.id, shopId))
  }

  async updateAlerts(userId: string, shopId: string, alertConfig: ShopAlertConfig) {
    const shop = await this.db.query.trackedShops.findFirst({
      where: and(eq(trackedShops.id, shopId), eq(trackedShops.userId, userId)),
    })
    if (!shop) throw new NotFoundException('Tracked shop not found')
    const [updated] = await this.db
      .update(trackedShops)
      .set({ alertConfig })
      .where(eq(trackedShops.id, shopId))
      .returning()
    return updated
  }

  async getShop(userId: string, shopId: string) {
    const shop = await this.db.query.trackedShops.findFirst({
      where: and(eq(trackedShops.id, shopId), eq(trackedShops.userId, userId)),
    })
    if (!shop) throw new NotFoundException('Tracked shop not found')
    return shop
  }

  async getAllTrackedShopIds(): Promise<{ etsyShopId: string; userId: string }[]> {
    const all = await this.db.query.trackedShops.findMany()
    return all.map((s) => ({ etsyShopId: s.etsyShopId, userId: s.userId }))
  }
}
