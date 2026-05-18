import { Injectable } from '@nestjs/common'
import type { ShopDiff } from '@etsy-analyzer/types'
import type { ShopSnapshotData } from '../snapshot/snapshot.service'

const PRICE_CHANGE_THRESHOLD = 0.05   // 5%
const REVIEW_MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]

@Injectable()
export class DiffService {
  computeDiff(current: ShopSnapshotData, previous: ShopSnapshotData): ShopDiff {
    const prevIds = new Set(previous.listings.map((l) => l.listingId))
    const currIds = new Set(current.listings.map((l) => l.listingId))

    // New listings: in current but not in previous
    const newListings = current.listings
      .filter((l) => !prevIds.has(l.listingId))
      .map((l) => l.listingId)

    // Removed listings
    const removedListings = previous.listings
      .filter((l) => !currIds.has(l.listingId))
      .map((l) => l.listingId)

    // Price changes (>5%)
    const prevMap = new Map(previous.listings.map((l) => [l.listingId, l]))
    const priceChanges: ShopDiff['priceChanges'] = []
    for (const curr of current.listings) {
      const prev = prevMap.get(curr.listingId)
      if (!prev || curr.priceUsd == null || prev.priceUsd == null) continue
      const changePct = (curr.priceUsd - prev.priceUsd) / prev.priceUsd
      if (Math.abs(changePct) > PRICE_CHANGE_THRESHOLD) {
        priceChanges.push({
          listingId: curr.listingId,
          oldPrice: prev.priceUsd,
          newPrice: curr.priceUsd,
          changePct: Math.round(changePct * 1000) / 10,
        })
      }
    }

    // Review milestones
    const reviewMilestones: ShopDiff['reviewMilestones'] = []
    for (const curr of current.listings) {
      const prev = prevMap.get(curr.listingId)
      if (!prev) continue
      for (const milestone of REVIEW_MILESTONES) {
        if (prev.numReviews < milestone && curr.numReviews >= milestone) {
          reviewMilestones.push({ listingId: curr.listingId, milestone })
        }
      }
    }

    return { newListings, removedListings, priceChanges, reviewMilestones }
  }

  hasMeaningfulChanges(diff: ShopDiff): boolean {
    return (
      diff.newListings.length > 0 ||
      diff.priceChanges.length > 0 ||
      diff.reviewMilestones.length > 0
    )
  }
}
