-- ============================================================
-- MikeGira.dev — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. CONTACT FORM SUBMISSIONS
-- Stores every message sent through the contact form
CREATE TABLE IF NOT EXISTS contact_submissions (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT        NOT NULL CHECK (char_length(name) <= 100),
  email           TEXT        NOT NULL CHECK (char_length(email) <= 200),
  opportunity     TEXT        DEFAULT 'Other',
  message         TEXT        NOT NULL CHECK (char_length(message) <= 5000),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  is_read         BOOLEAN     DEFAULT FALSE
);

-- 2. NEWSLETTER SUBSCRIBERS
-- Stores email addresses from the blog newsletter widget
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              BIGSERIAL PRIMARY KEY,
  email           TEXT        NOT NULL UNIQUE CHECK (char_length(email) <= 200),
  subscribed_at   TIMESTAMPTZ DEFAULT NOW(),
  is_active       BOOLEAN     DEFAULT TRUE
);

-- 3. PAGE VIEWS
-- Tracks visit counts for index.html and blog.html
CREATE TABLE IF NOT EXISTS page_views (
  id              BIGSERIAL PRIMARY KEY,
  page            TEXT        NOT NULL UNIQUE,
  views           INTEGER     DEFAULT 0,
  first_visited   TIMESTAMPTZ DEFAULT NOW(),
  last_visited    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BLOG POST VIEWS
-- Tracks which AI-generated blog articles get read most
CREATE TABLE IF NOT EXISTS blog_post_views (
  id              BIGSERIAL PRIMARY KEY,
  post_id         TEXT        NOT NULL UNIQUE,
  title           TEXT        NOT NULL,
  category        TEXT        DEFAULT 'General',
  views           INTEGER     DEFAULT 0,
  first_viewed    TIMESTAMPTZ DEFAULT NOW(),
  last_viewed     TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ANALYTICS EVENTS
-- Fine-grained event log for time-series stats on /stats page
-- Events: pageview, chat_start, chat_message, section_view, project_click, cta_click
CREATE TABLE IF NOT EXISTS analytics_events (
  id          BIGSERIAL    PRIMARY KEY,
  event_type  TEXT         NOT NULL CHECK (char_length(event_type) <= 50),
  metadata    JSONB        DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Restricts direct browser access. Only your service key (used
-- in api/db.js on the server) can read/write these tables.
-- ============================================================
ALTER TABLE contact_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views             ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_views        ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events       ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by api/db.js)
CREATE POLICY "Service role full access" ON contact_submissions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON newsletter_subscribers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON page_views
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON blog_post_views
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON analytics_events
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_contacts_created   ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_email      ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_email   ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_pageviews_page      ON page_views(page);
CREATE INDEX IF NOT EXISTS idx_blogviews_post      ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blogviews_views     ON blog_post_views(views DESC);
CREATE INDEX IF NOT EXISTS idx_events_created      ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type         ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_type_time    ON analytics_events(event_type, created_at DESC);

-- ============================================================
-- DATA API GRANTS (Supabase May/Oct 2026 compliance)
-- All access is via serverless proxy (api/db.js) using
-- service_role only. anon and authenticated have no direct
-- table access by design — all writes go through /api/db.
-- ============================================================
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_submissions    TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_views              TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_post_views         TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_events         TO service_role;
GRANT USAGE, SELECT ON SEQUENCE analytics_events_id_seq                 TO service_role;

REVOKE ALL ON public.contact_submissions    FROM anon, authenticated;
REVOKE ALL ON public.newsletter_subscribers  FROM anon, authenticated;
REVOKE ALL ON public.page_views              FROM anon, authenticated;
REVOKE ALL ON public.blog_post_views         FROM anon, authenticated;
REVOKE ALL ON public.analytics_events        FROM anon, authenticated;

-- rls_auto_enable is a Supabase internal function — revoke from PUBLIC, not just
-- individual roles, since the PUBLIC grant overrides role-level revokes
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

-- ============================================================
-- PERFORMANCE FUNCTIONS (replaces O(n) JS aggregation)
-- Run in Supabase SQL Editor — used by api/stats.js
-- ============================================================

-- Returns daily pageview counts for the sparkline chart
CREATE OR REPLACE FUNCTION get_daily_pageviews(days_back INTEGER DEFAULT 30)
RETURNS TABLE (day DATE, views BIGINT)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')::DATE AS day,
    COUNT(*) AS views
  FROM analytics_events
  WHERE event_type = 'pageview'
    AND created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY 1
  ORDER BY 1;
$$;

-- Returns aggregated metadata breakdown (country, browser, OS, etc.) from pageview events
CREATE OR REPLACE FUNCTION get_pageview_meta_breakdown(days_back INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE sql SECURITY DEFINER
AS $$
  WITH events AS (
    SELECT metadata FROM analytics_events
    WHERE event_type = 'pageview'
      AND created_at >= NOW() - (days_back || ' days')::INTERVAL
  ),
  countries AS (
    SELECT metadata->>'country' AS name, COUNT(*) AS count FROM events
    WHERE metadata->>'country' IS NOT NULL AND metadata->>'country' NOT IN ('Unknown', '')
    GROUP BY 1 ORDER BY 2 DESC LIMIT 15
  ),
  cities AS (
    SELECT metadata->>'city' AS name, COUNT(*) AS count FROM events
    WHERE metadata->>'city' IS NOT NULL AND metadata->>'city' NOT IN ('Unknown', '')
    GROUP BY 1 ORDER BY 2 DESC LIMIT 10
  ),
  browsers AS (
    SELECT metadata->>'browser' AS name, COUNT(*) AS count FROM events
    WHERE metadata->>'browser' IS NOT NULL AND metadata->>'browser' NOT IN ('Unknown', '')
    GROUP BY 1 ORDER BY 2 DESC LIMIT 10
  ),
  os_data AS (
    SELECT metadata->>'os' AS name, COUNT(*) AS count FROM events
    WHERE metadata->>'os' IS NOT NULL AND metadata->>'os' NOT IN ('Unknown', '')
    GROUP BY 1 ORDER BY 2 DESC LIMIT 10
  ),
  devices AS (
    SELECT metadata->>'device' AS name, COUNT(*) AS count FROM events
    WHERE metadata->>'device' IS NOT NULL AND metadata->>'device' NOT IN ('Unknown', '')
    GROUP BY 1 ORDER BY 2 DESC LIMIT 10
  ),
  languages AS (
    SELECT metadata->>'lang' AS name, COUNT(*) AS count FROM events
    WHERE metadata->>'lang' IS NOT NULL AND metadata->>'lang' NOT IN ('un', '')
    GROUP BY 1 ORDER BY 2 DESC LIMIT 10
  )
  SELECT json_build_object(
    'countries',          (SELECT json_agg(json_build_object('name', name, 'count', count)) FROM countries),
    'cities',             (SELECT json_agg(json_build_object('name', name, 'count', count)) FROM cities),
    'browsers',           (SELECT json_agg(json_build_object('name', name, 'count', count)) FROM browsers),
    'os',                 (SELECT json_agg(json_build_object('name', name, 'count', count)) FROM os_data),
    'devices',            (SELECT json_agg(json_build_object('name', name, 'count', count)) FROM devices),
    'languages',          (SELECT json_agg(json_build_object('name', name, 'count', count)) FROM languages),
    'new_visitors',       (SELECT COUNT(*) FROM events WHERE metadata->>'new_visitor' = 'true'),
    'returning_visitors', (SELECT COUNT(*) FROM events WHERE metadata->>'new_visitor' = 'false')
  );
$$;

-- Grant execute to service_role only
GRANT EXECUTE ON FUNCTION get_daily_pageviews(INTEGER)          TO service_role;
GRANT EXECUTE ON FUNCTION get_pageview_meta_breakdown(INTEGER)  TO service_role;

-- ============================================================
-- ANALYTICS ARCHIVAL (prevents unbounded table growth)
-- Requires pg_cron enabled in Supabase (Database → Extensions)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events_archive (LIKE analytics_events INCLUDING ALL);

-- Archive events older than 90 days every Sunday at 3am UTC
-- Run in Supabase SQL Editor after enabling pg_cron extension:
-- SELECT cron.schedule(
--   'archive-analytics-events',
--   '0 3 * * 0',
--   $$
--     INSERT INTO analytics_events_archive
--       SELECT * FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
--     DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
--   $$
-- );

-- ============================================================
-- VERIFY: Run this to confirm tables were created
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
