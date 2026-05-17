import type { Competition, TrendDirection } from './listing'

export interface Keyword {
  id: string
  keyword: string
  volumeEst: number | null
  competition: Competition | null
  trendDirection: TrendDirection | null
  lastUpdated: string | null
  createdAt: string
}

export interface KeywordSearchResult {
  keyword: string
  volumeEst: number | null
  competition: Competition | null
  trendDirection: TrendDirection | null
  related: string[]
  nicheScore: NicheScore | null
}

export interface NicheScore {
  score: number
  rating: 'excellent' | 'good' | 'moderate' | 'saturated'
  components: {
    volume: number
    competition: number
    avgReviews: number
    trend: TrendDirection
  }
}

export interface KeywordList {
  id: string
  userId: string
  name: string
  createdAt: string
}

export interface KeywordListItem {
  id: string
  listId: string
  keyword: string
  volumeEst: number | null
  competition: Competition | null
  notes: string | null
  addedAt: string
}

export interface KeywordCluster {
  keywords: string[]
  size: number
}

export interface TitleOptimisationResult {
  title: string
  explanation: string
  keywordsUsed: string[]
}
