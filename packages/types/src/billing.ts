import type { Plan } from './user'

export interface PlanLimits {
  researchSearches: number   // -1 = unlimited
  grades: number
  keywords: number
  competitors: number
  exports: number
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:    { researchSearches: 5,   grades: 2,   keywords: 10,  competitors: 0,   exports: 1  },
  starter: { researchSearches: 50,  grades: 20,  keywords: 100, competitors: 5,   exports: 10 },
  pro:     { researchSearches: 500, grades: 200, keywords: -1,  competitors: 25,  exports: 50 },
  agency:  { researchSearches: -1,  grades: -1,  keywords: -1,  competitors: 100, exports: -1 },
}

export interface UsageStats {
  researchSearches: { used: number; limit: number }
  grades: { used: number; limit: number }
  keywords: { used: number; limit: number }
  competitors: { used: number; limit: number }
  exports: { used: number; limit: number }
}

export interface Subscription {
  plan: Plan
  planStatus: 'active' | 'past_due' | 'canceled'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  usage: UsageStats
}
