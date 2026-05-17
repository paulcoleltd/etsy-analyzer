export type Plan = 'free' | 'starter' | 'pro' | 'agency'
export type PlanStatus = 'active' | 'past_due' | 'canceled'

export interface User {
  id: string
  email: string
  emailVerified: boolean
  name: string | null
  avatarUrl: string | null
  plan: Plan
  planStatus: PlanStatus
  stripeCustomerId: string | null
  stripeSubId: string | null
  planExpiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends User {
  etsyConnected: boolean
  etsyShopName: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface JwtPayload {
  sub: string
  email: string
  plan: Plan
  jti: string
  iat: number
  exp: number
}

export interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  lastUsed: string | null
  revoked: boolean
  createdAt: string
}
