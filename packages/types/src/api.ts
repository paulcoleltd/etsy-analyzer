export interface ApiError {
  error: string
  message: string
  details?: Record<string, unknown>
  requestId: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface RateLimitError extends ApiError {
  error: 'limit_reached'
  feature: string
  limit: number
  current: number
  upgradeUrl: string
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down'
  service: string
  timestamp: string
  dependencies?: Record<string, 'ok' | 'down'>
}
