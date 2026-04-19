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

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Restricts direct browser access. Only your service key (used
-- in api/db.js on the server) can read/write these tables.
-- ============================================================
ALTER TABLE contact_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views             ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_views        ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by api/db.js)
CREATE POLICY "Service role full access" ON contact_submissions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON newsletter_subscribers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON page_views
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON blog_post_views
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

-- ============================================================
-- VERIFY: Run this to confirm tables were created
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
