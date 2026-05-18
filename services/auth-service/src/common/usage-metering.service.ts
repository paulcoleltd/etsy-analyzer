import { Injectable } from '@nestjs/common'
import { getDb, usageEvents } from '@etsy-analyzer/db'
import { sql } from 'drizzle-orm'

export type UsageEventType =
  | 'research_search'
  | 'grade_listing'
  | 'keyword_search'
  | 'csv_export'
  | 'competitor_add'

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free:    { research_searches: 5,   grades: 2,   keywords: 10,  competitors: 0,   exports: 1  },
  starter: { research_searches: 50,  grades: 20,  keywords: 100, competitors: 5,   exports: 10 },
  pro:     { research_searches: 500, grades: 200, keywords: -1,  competitors: 25,  exports: 50 },
  agency:  { research_searches: -1,  grades: -1,  keywords: -1,  competitors: 100, exports: -1 },
}

const EVENT_TO_FEATURE: Record<UsageEventType, string> = {
  research_search: 'research_searches',
  grade_listing:   'grades',
  keyword_search:  'keywords',
  csv_export:      'exports',
  competitor_add:  'competitors',
}

@Injectable()
export class UsageMeteringService {
  private db = getDb()

  async track(userId: string, eventType: UsageEventType): Promise<void> {
    await this.db.insert(usageEvents).values({ userId, eventType })
  }

  async getUsageTodayForUser(userId: string): Promise<Record<string, number>> {
    const rows = await this.db.execute(sql`
      SELECT event_type, COUNT(*)::int AS cnt
      FROM usage_events
      WHERE user_id = ${userId}
        AND DATE(created_at) = CURRENT_DATE
      GROUP BY event_type
    `)
    const result: Record<string, number> = {}
    for (const row of rows.rows as Array<{ event_type: string; cnt: number }>) {
      result[row.event_type] = row.cnt
    }
    return result
  }

  async getUsageStats(userId: string, plan: string) {
    const today = await this.getUsageTodayForUser(userId)
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
    const stats: Record<string, { used: number; limit: number }> = {}

    for (const [eventType, feature] of Object.entries(EVENT_TO_FEATURE)) {
      const used = today[eventType] ?? 0
      const limit = limits[feature] ?? 0
      stats[feature] = { used, limit }
    }
    return stats
  }
}
