export type NotificationType =
  | 'new_listing'
  | 'price_change'
  | 'review_milestone'
  | 'grade_complete'
  | 'billing'
  | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  metadata: Record<string, unknown> | null
  read: boolean
  createdAt: string
}

export interface NotificationSettings {
  weeklyDigest: boolean
  instantAlerts: boolean
  emailEnabled: boolean
}
