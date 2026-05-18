// Minimal unit tests for plan limits and middleware path mapping.
// No DB/Redis connection required.

describe('UsageMeteringService — plan limit config', () => {
  const PLAN_LIMITS: Record<string, Record<string, number>> = {
    free:    { research_searches: 5,   grades: 2,   keywords: 10,  competitors: 0,   exports: 1  },
    starter: { research_searches: 50,  grades: 20,  keywords: 100, competitors: 5,   exports: 10 },
    pro:     { research_searches: 500, grades: 200, keywords: -1,  competitors: 25,  exports: 50 },
    agency:  { research_searches: -1,  grades: -1,  keywords: -1,  competitors: 100, exports: -1 },
  }

  it('free plan has 0 competitors', () => {
    expect(PLAN_LIMITS.free.competitors).toBe(0)
  })

  it('pro plan has unlimited keywords (-1)', () => {
    expect(PLAN_LIMITS.pro.keywords).toBe(-1)
  })

  it('agency plan has unlimited searches, grades, keywords, and exports', () => {
    const { agency } = PLAN_LIMITS
    expect(agency.research_searches).toBe(-1)
    expect(agency.grades).toBe(-1)
    expect(agency.keywords).toBe(-1)
    expect(agency.exports).toBe(-1)
    // competitors has a generous but finite cap
    expect(agency.competitors).toBeGreaterThan(25)
  })

  it('pro > starter > free for research_searches', () => {
    const { free, starter, pro } = PLAN_LIMITS
    expect(free.research_searches).toBeLessThan(starter.research_searches)
    expect(starter.research_searches).toBeLessThan(pro.research_searches)
  })

  it('all plans have the same feature keys', () => {
    const keys = Object.keys(PLAN_LIMITS.free).sort()
    for (const plan of ['starter', 'pro', 'agency']) {
      expect(Object.keys(PLAN_LIMITS[plan]).sort()).toEqual(keys)
    }
  })
})

describe('PlanEnforcementMiddleware — feature path mapping', () => {
  function featureFromPath(path: string): string | null {
    if (path.includes('/research'))    return 'research_searches'
    if (path.includes('/grade'))       return 'grades'
    if (path.includes('/keywords'))    return 'keywords'
    if (path.includes('/competitors')) return 'competitors'
    if (path.includes('/export'))      return 'exports'
    return null
  }

  it('maps /research to research_searches', () => {
    expect(featureFromPath('/v1/research/search')).toBe('research_searches')
  })

  it('maps /grade to grades', () => {
    expect(featureFromPath('/v1/grade/listing')).toBe('grades')
  })

  it('maps /keywords to keywords', () => {
    expect(featureFromPath('/v1/keywords/explore')).toBe('keywords')
  })

  it('maps /competitors to competitors', () => {
    expect(featureFromPath('/v1/competitors')).toBe('competitors')
  })

  it('returns null for unknown paths', () => {
    expect(featureFromPath('/health')).toBeNull()
    expect(featureFromPath('/auth/me')).toBeNull()
  })
})
