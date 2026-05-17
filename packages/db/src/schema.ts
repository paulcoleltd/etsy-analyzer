import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  numeric,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ── USERS & AUTH ─────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').unique().notNull(),
  emailVerified: boolean('email_verified').default(false),
  passwordHash: text('password_hash'),
  googleId: text('google_id').unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  plan: text('plan').notNull().default('free'),
  planStatus: text('plan_status').notNull().default('active'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubId: text('stripe_sub_id'),
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const passwordResets = pgTable('password_resets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revoked: boolean('revoked').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  lastUsed: timestamp('last_used', { withTimezone: true }),
  revoked: boolean('revoked').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

// ── ETSY INTEGRATION ─────────────────────────────────────────────

export const etsyConnections = pgTable('etsy_connections', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  etsyUserId: text('etsy_user_id').notNull(),
  etsyShopId: text('etsy_shop_id'),
  etsyShopName: text('etsy_shop_name'),
  accessToken: text('access_token').notNull(),   // AES-256-GCM encrypted
  refreshToken: text('refresh_token').notNull(), // AES-256-GCM encrypted
  tokenIv: text('token_iv').notNull(),
  tokenTag: text('token_tag').notNull(),
  scopes: text('scopes').array().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
})

// ── SHOP DATA ────────────────────────────────────────────────────

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  etsyShopId: text('etsy_shop_id').unique().notNull(),
  shopName: text('shop_name').notNull(),
  ownerUserId: uuid('owner_user_id').references(() => users.id),
  currency: text('currency').default('USD'),
  countryCode: text('country_code'),
  lastSynced: timestamp('last_synced', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  etsyListingId: text('etsy_listing_id').unique().notNull(),
  shopId: text('shop_id').notNull(),
  title: text('title'),
  description: text('description'),
  tags: text('tags').array(),
  price: numeric('price', { precision: 10, scale: 2 }),
  currency: text('currency').default('USD'),
  priceUsd: numeric('price_usd', { precision: 10, scale: 2 }),
  categoryPath: text('category_path').array(),
  categoryL1: text('category_l1'),
  photoCount: integer('photo_count').default(0),
  hasVideo: boolean('has_video').default(false),
  shippingFree: boolean('shipping_free').default(false),
  isBestseller: boolean('is_bestseller').default(false),
  numReviews: integer('num_reviews').default(0),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),
  listingAgeDays: integer('listing_age_days'),
  views30d: integer('views_30d'),
  estMonthlyRevenue: numeric('est_monthly_revenue', { precision: 10, scale: 2 }),
  estMonthlyUnits: integer('est_monthly_units'),
  revenueConfidence: text('revenue_confidence'),
  opportunityScore: numeric('opportunity_score', { precision: 5, scale: 2 }),
  listingGrade: text('listing_grade'),
  lastScraped: timestamp('last_scraped', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (t) => ({
  shopIdx: index('idx_listings_shop').on(t.shopId),
  categoryIdx: index('idx_listings_category').on(t.categoryL1),
  opportunityIdx: index('idx_listings_opportunity').on(t.opportunityScore),
  scrapedIdx: index('idx_listings_scraped').on(t.lastScraped),
}))

// ── KEYWORD DATA ─────────────────────────────────────────────────

export const keywords = pgTable('keywords', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  keyword: text('keyword').unique().notNull(),
  volumeEst: integer('volume_est'),
  competition: text('competition'),
  trendDirection: text('trend_direction'),
  lastUpdated: timestamp('last_updated', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const keywordLists = pgTable('keyword_lists', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const keywordListItems = pgTable('keyword_list_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  listId: uuid('list_id').notNull().references(() => keywordLists.id, { onDelete: 'cascade' }),
  keyword: text('keyword').notNull(),
  volumeEst: integer('volume_est'),
  competition: text('competition'),
  notes: text('notes'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().default(sql`now()`),
})

// ── COMPETITOR TRACKING ──────────────────────────────────────────

export const trackedShops = pgTable('tracked_shops', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  etsyShopId: text('etsy_shop_id').notNull(),
  shopName: text('shop_name').notNull(),
  alertConfig: jsonb('alert_config').notNull().default(sql`'{"new_listing": true, "price_change": true, "review_milestone": false, "channels": ["in_app", "email"]}'`),
  lastChecked: timestamp('last_checked', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (t) => ({
  userShopUniq: uniqueIndex('uq_tracked_shops_user_shop').on(t.userId, t.etsyShopId),
}))

export const shopSnapshots = pgTable('shop_snapshots', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  etsyShopId: text('etsy_shop_id').notNull(),
  listingCount: integer('listing_count'),
  totalSalesEst: integer('total_sales_est'),
  snapshotData: jsonb('snapshot_data'),
  takenAt: timestamp('taken_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (t) => ({
  shopTimeIdx: index('idx_snapshots_shop_time').on(t.etsyShopId, t.takenAt),
}))

// ── LISTING GRADES ───────────────────────────────────────────────

export const listingGrades = pgTable('listing_grades', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id),
  etsyListingId: text('etsy_listing_id').notNull(),
  overallGrade: text('overall_grade').notNull(),
  titleScore: numeric('title_score', { precision: 4, scale: 1 }),
  tagScore: numeric('tag_score', { precision: 4, scale: 1 }),
  descriptionScore: numeric('description_score', { precision: 4, scale: 1 }),
  photoScore: numeric('photo_score', { precision: 4, scale: 1 }),
  priceScore: numeric('price_score', { precision: 4, scale: 1 }),
  shippingScore: numeric('shipping_score', { precision: 4, scale: 1 }),
  aiSuggestions: jsonb('ai_suggestions'),
  imageAnalysis: jsonb('image_analysis'),
  gradedAt: timestamp('graded_at', { withTimezone: true }).notNull().default(sql`now()`),
})

// ── NOTIFICATIONS ────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  metadata: jsonb('metadata'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (t) => ({
  userReadTimeIdx: index('idx_notifications_user').on(t.userId, t.read, t.createdAt),
}))

// ── USAGE METERING ───────────────────────────────────────────────

export const usageEvents = pgTable('usage_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
}, (t) => ({
  userTypeDay: index('idx_usage_user_type_day').on(t.userId, t.eventType, t.createdAt),
}))
