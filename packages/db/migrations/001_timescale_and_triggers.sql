-- ── TimescaleDB Extension ────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_listings_updated
  BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_etsy_connections_updated
  BEFORE UPDATE ON etsy_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── TIME-SERIES TABLES ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS listing_metrics (
  listing_id    TEXT NOT NULL,
  recorded_at   TIMESTAMPTZ NOT NULL,
  views         INT,
  favourites    INT,
  num_reviews   INT,
  est_revenue   NUMERIC(10,2),
  rank_position INT
);

SELECT create_hypertable('listing_metrics', 'recorded_at',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_lm_listing_time ON listing_metrics(listing_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS keyword_metrics (
  keyword         TEXT NOT NULL,
  recorded_at     TIMESTAMPTZ NOT NULL,
  volume_est      INT,
  competing_count INT,
  trend_score     NUMERIC(5,2)
);

SELECT create_hypertable('keyword_metrics', 'recorded_at',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS shop_metrics (
  etsy_shop_id  TEXT NOT NULL,
  recorded_at   TIMESTAMPTZ NOT NULL,
  est_revenue   NUMERIC(10,2),
  listing_count INT,
  avg_reviews   NUMERIC(5,2)
);

SELECT create_hypertable('shop_metrics', 'recorded_at',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE);

-- ── CONTINUOUS AGGREGATES ────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS listing_daily_agg
  WITH (timescaledb.continuous) AS
  SELECT
    listing_id,
    time_bucket('1 day', recorded_at) AS day,
    avg(views)          AS avg_views,
    last(num_reviews, recorded_at) AS reviews,
    sum(est_revenue)    AS daily_revenue
  FROM listing_metrics
  GROUP BY 1, 2
  WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS listing_weekly_agg
  WITH (timescaledb.continuous) AS
  SELECT
    listing_id,
    time_bucket('7 days', recorded_at) AS week,
    avg(views)          AS avg_views,
    last(num_reviews, recorded_at) AS reviews,
    sum(est_revenue)    AS weekly_revenue
  FROM listing_metrics
  GROUP BY 1, 2
  WITH NO DATA;

SELECT add_continuous_aggregate_policy('listing_daily_agg',
  start_offset  => INTERVAL '3 days',
  end_offset    => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('listing_weekly_agg',
  start_offset  => INTERVAL '14 days',
  end_offset    => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day',
  if_not_exists => TRUE);

-- ── RETENTION POLICIES ───────────────────────────────────────────

SELECT add_retention_policy('listing_metrics', INTERVAL '90 days', if_not_exists => TRUE);
