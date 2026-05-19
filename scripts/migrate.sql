-- Etsy Analyzer — full schema migration
-- Run with: psql -U postgres -d etsy_analyzer -f scripts\migrate.sql

-- USERS & AUTH
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  google_id TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT UNIQUE,
  stripe_sub_id TEXT,
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ETSY INTEGRATION
CREATE TABLE IF NOT EXISTS etsy_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  etsy_user_id TEXT NOT NULL,
  etsy_shop_id TEXT,
  etsy_shop_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_iv TEXT NOT NULL,
  token_tag TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SHOP DATA
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etsy_shop_id TEXT UNIQUE NOT NULL,
  shop_name TEXT NOT NULL,
  owner_user_id UUID REFERENCES users(id),
  currency TEXT DEFAULT 'USD',
  country_code TEXT,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etsy_listing_id TEXT UNIQUE NOT NULL,
  shop_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT[],
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  price_usd NUMERIC(10,2),
  category_path TEXT[],
  category_l1 TEXT,
  photo_count INTEGER DEFAULT 0,
  has_video BOOLEAN DEFAULT FALSE,
  shipping_free BOOLEAN DEFAULT FALSE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  num_reviews INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2),
  listing_age_days INTEGER,
  views_30d INTEGER,
  est_monthly_revenue NUMERIC(10,2),
  est_monthly_units INTEGER,
  revenue_confidence TEXT,
  opportunity_score NUMERIC(5,2),
  listing_grade TEXT,
  last_scraped TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_shop ON listings(shop_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_l1);
CREATE INDEX IF NOT EXISTS idx_listings_opportunity ON listings(opportunity_score);
CREATE INDEX IF NOT EXISTS idx_listings_scraped ON listings(last_scraped);

-- KEYWORD DATA
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT UNIQUE NOT NULL,
  volume_est INTEGER,
  competition TEXT,
  trend_direction TEXT,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS keyword_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS keyword_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES keyword_lists(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  volume_est INTEGER,
  competition TEXT,
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMPETITOR TRACKING
CREATE TABLE IF NOT EXISTS tracked_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  etsy_shop_id TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  alert_config JSONB NOT NULL DEFAULT '{"new_listing": true, "price_change": true, "review_milestone": false, "channels": ["in_app", "email"]}',
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_tracked_shops_user_shop UNIQUE (user_id, etsy_shop_id)
);

CREATE TABLE IF NOT EXISTS shop_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etsy_shop_id TEXT NOT NULL,
  listing_count INTEGER,
  total_sales_est INTEGER,
  snapshot_data JSONB,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_shop_time ON shop_snapshots(etsy_shop_id, taken_at);

-- LISTING GRADES
CREATE TABLE IF NOT EXISTS listing_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  etsy_listing_id TEXT NOT NULL,
  overall_grade TEXT NOT NULL,
  title_score NUMERIC(4,1),
  tag_score NUMERIC(4,1),
  description_score NUMERIC(4,1),
  photo_score NUMERIC(4,1),
  price_score NUMERIC(4,1),
  shipping_score NUMERIC(4,1),
  ai_suggestions JSONB,
  image_analysis JSONB,
  graded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at);

-- USAGE METERING
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_user_type_day ON usage_events(user_id, event_type, created_at);

\echo 'Migration complete — all 16 tables created.'
