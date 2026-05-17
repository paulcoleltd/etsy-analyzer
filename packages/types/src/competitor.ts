export interface TrackedShop {
  id: string
  userId: string
  etsyShopId: string
  shopName: string
  alertConfig: ShopAlertConfig
  lastChecked: string | null
  createdAt: string
}

export interface ShopAlertConfig {
  newListing: boolean
  priceChange: boolean
  reviewMilestone: boolean
  channels: Array<'in_app' | 'email'>
}

export interface ShopSnapshot {
  id: string
  etsyShopId: string
  listingCount: number | null
  totalSalesEst: number | null
  snapshotData: Record<string, unknown>
  takenAt: string
}

export interface ShopDiff {
  newListings: string[]
  removedListings: string[]
  priceChanges: Array<{
    listingId: string
    oldPrice: number
    newPrice: number
    changePct: number
  }>
  reviewMilestones: Array<{
    listingId: string
    milestone: number
  }>
}

export interface Shop {
  id: string
  etsyShopId: string
  shopName: string
  ownerUserId: string | null
  currency: string
  countryCode: string | null
  lastSynced: string | null
  createdAt: string
}
