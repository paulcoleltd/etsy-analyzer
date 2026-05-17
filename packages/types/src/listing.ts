export type ListingGrade = 'A' | 'B' | 'C' | 'D' | 'F'
export type RevenueConfidence = 'low' | 'medium' | 'high'
export type Competition = 'low' | 'medium' | 'high'
export type TrendDirection = 'rising' | 'stable' | 'seasonal' | 'declining'

export interface Listing {
  id: string
  etsyListingId: string
  shopId: string
  title: string | null
  description: string | null
  tags: string[]
  price: number | null
  currency: string
  priceUsd: number | null
  categoryPath: string[]
  categoryL1: string | null
  photoCount: number
  hasVideo: boolean
  shippingFree: boolean
  isBestseller: boolean
  numReviews: number
  avgRating: number | null
  listingAgeDays: number | null
  views30d: number | null
  estMonthlyRevenue: number | null
  estMonthlyUnits: number | null
  revenueConfidence: RevenueConfidence | null
  opportunityScore: number | null
  listingGrade: ListingGrade | null
  lastScraped: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ListingSearchResult extends Pick<Listing,
  'etsyListingId' | 'shopId' | 'title' | 'priceUsd' | 'numReviews' |
  'estMonthlyRevenue' | 'estMonthlyUnits' | 'revenueConfidence' |
  'opportunityScore' | 'listingGrade' | 'isBestseller' | 'categoryL1'
> {
  shopName?: string
}

export interface ListingGradeResult {
  overallGrade: ListingGrade
  overallScore: number
  dimensionScores: {
    title: number
    tags: number
    description: number
    photos: number
    price: number
    shipping: number
  }
  aiSuggestions: AiSuggestions | null
  imageAnalysis: ImageAnalysis[] | null
  gradedAt: string
}

export interface AiSuggestions {
  titleRewrite: string | null
  tagAdditions: string[]
  tagRemovals: string[]
  descriptionTips: string[]
  photoTips: string[]
  priorityActions: string[]
}

export interface ImageAnalysis {
  resolutionScore: number
  productProminence: number
  backgroundQuality: number
  hasTextOverlay: boolean
  isLifestyle: boolean
  overallScore: number
  flags: string[]
}
