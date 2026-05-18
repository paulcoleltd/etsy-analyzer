import { DiffService } from './diff.service'
import type { ShopSnapshotData } from '../snapshot/snapshot.service'

function makeSnap(listings: Array<{ id: string; price?: number; reviews?: number }>): ShopSnapshotData {
  return {
    listingCount: listings.length,
    totalSalesEst: null,
    listings: listings.map((l) => ({
      listingId: l.id,
      title: null,
      priceUsd: l.price ?? 20,
      numReviews: l.reviews ?? 0,
      isBestseller: false,
    })),
  }
}

describe('DiffService', () => {
  let svc: DiffService

  beforeEach(() => { svc = new DiffService() })

  describe('computeDiff', () => {
    it('detects new listings', () => {
      const prev = makeSnap([{ id: 'A' }])
      const curr = makeSnap([{ id: 'A' }, { id: 'B' }])
      const diff = svc.computeDiff(curr, prev)
      expect(diff.newListings).toEqual(['B'])
      expect(diff.removedListings).toHaveLength(0)
    })

    it('detects removed listings', () => {
      const prev = makeSnap([{ id: 'A' }, { id: 'B' }])
      const curr = makeSnap([{ id: 'A' }])
      const diff = svc.computeDiff(curr, prev)
      expect(diff.removedListings).toEqual(['B'])
    })

    it('detects price increase >5%', () => {
      const prev = makeSnap([{ id: 'X', price: 20 }])
      const curr = makeSnap([{ id: 'X', price: 23 }])
      const diff = svc.computeDiff(curr, prev)
      expect(diff.priceChanges).toHaveLength(1)
      expect(diff.priceChanges[0].changePct).toBeCloseTo(15, 0)
    })

    it('ignores price change <= 5%', () => {
      const prev = makeSnap([{ id: 'X', price: 20 }])
      const curr = makeSnap([{ id: 'X', price: 20.5 }])
      const diff = svc.computeDiff(curr, prev)
      expect(diff.priceChanges).toHaveLength(0)
    })

    it('detects review milestone crossing', () => {
      const prev = makeSnap([{ id: 'R', reviews: 9 }])
      const curr = makeSnap([{ id: 'R', reviews: 12 }])
      const diff = svc.computeDiff(curr, prev)
      expect(diff.reviewMilestones).toHaveLength(1)
      expect(diff.reviewMilestones[0].milestone).toBe(10)
    })

    it('does not fire milestone if already past', () => {
      const prev = makeSnap([{ id: 'R', reviews: 15 }])
      const curr = makeSnap([{ id: 'R', reviews: 20 }])
      const diff = svc.computeDiff(curr, prev)
      expect(diff.reviewMilestones).toHaveLength(0)
    })

    it('empty diffs have no changes', () => {
      const snap = makeSnap([{ id: 'A', price: 10, reviews: 5 }])
      const diff = svc.computeDiff(snap, snap)
      expect(svc.hasMeaningfulChanges(diff)).toBe(false)
    })

    it('hasMeaningfulChanges returns true for new listings', () => {
      const prev = makeSnap([])
      const curr = makeSnap([{ id: 'NEW' }])
      const diff = svc.computeDiff(curr, prev)
      expect(svc.hasMeaningfulChanges(diff)).toBe(true)
    })
  })
})
