-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR MOVIE CATALOG
-- ====================================================================

-- 1. Create custom extension for full-text search if not exists
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. Create the main 'movies' table
CREATE TABLE IF NOT EXISTS public.movies (
    id TEXT PRIMARY KEY,                       -- URL-friendly stable slug (e.g. 'oppenheimer-2023')
    tmdb_id INTEGER,                           -- TMDB unique movie ID
    title TEXT NOT NULL,                       -- Primary display title
    original_title TEXT,                       -- Native language title
    year INTEGER NOT NULL,                     -- Release year
    release_date DATE,                         -- Official release date
    overview TEXT,                             -- TMDB official English overview
    synopsis TEXT,                             -- Localized Burmese synopsis & review
    poster_url TEXT NOT NULL,                  -- Full TMDB image URL
    backdrop_url TEXT,                         -- Full TMDB backdrop image URL
    genres TEXT[] DEFAULT '{}',                -- Array of genre tags (e.g. ['Action', 'Thriller'])
    type TEXT NOT NULL DEFAULT 'movie',        -- 'movie' | 'series'
    rating NUMERIC(3, 1) DEFAULT 0.0,          -- Vote average (e.g. 8.4)
    vote_count INTEGER DEFAULT 0,              -- TMDB vote count
    quality TEXT DEFAULT 'HD',                 -- '1080p', '4K', 'WEB-DL'
    language TEXT DEFAULT 'Myanmar Sub',       -- Subtitle / Audio language
    original_language VARCHAR(10),             -- ISO code (e.g. 'en', 'hi', 'ko')
    duration INTEGER,                          -- Runtime in minutes (e.g. 142)
    age_rating VARCHAR(20),                    -- 'PG-13', '18+', 'TV-MA'
    tg_link TEXT NOT NULL,                     -- Telegram target URL
    category TEXT DEFAULT 'Discover',          -- 'Discover', 'Trending', 'Popular', 'Collections'
    pin BOOLEAN DEFAULT FALSE,                 -- Spotlight premiere in Hero Banner
    trending BOOLEAN DEFAULT FALSE,            -- Explicit trending flag
    status TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'draft' | 'archived' | 'needs_review'
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),

    -- Data integrity constraints
    CONSTRAINT check_movie_type CHECK (type IN ('movie', 'series')),
    CONSTRAINT check_movie_status CHECK (status IN ('active', 'published', 'draft', 'archived', 'needs_review')),
    CONSTRAINT check_rating_range CHECK (rating >= 0.0 AND rating <= 10.0),
    CONSTRAINT check_valid_tg_link CHECK (tg_link ~* '^https?://')
);

-- 3. High-Performance Indexes for Frontend Queries
-- Index for Tab filtering & status
CREATE INDEX IF NOT EXISTS idx_movies_status_type ON public.movies (status, type);

-- Index for Trending filter
CREATE INDEX IF NOT EXISTS idx_movies_trending ON public.movies (status, trending) WHERE trending = TRUE;

-- Index for Hero Spotlight Pin
CREATE INDEX IF NOT EXISTS idx_movies_pinned ON public.movies (status, pin) WHERE pin = TRUE;

-- Index for Year & Chronological sorting
CREATE INDEX IF NOT EXISTS idx_movies_year_created ON public.movies (year DESC, created_at DESC);

-- Index for Category lookup
CREATE INDEX IF NOT EXISTS idx_movies_category ON public.movies (category);

-- Unique index on TMDB ID (prevents duplicates when tmdb_id is provided)
CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_tmdb_unique ON public.movies (tmdb_id) WHERE tmdb_id IS NOT NULL;

-- 4. Full-Text Search (FTS) Index for fast search bar
CREATE INDEX IF NOT EXISTS idx_movies_fts ON public.movies USING GIN (
    to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(original_title, '') || ' ' || COALESCE(synopsis, ''))
);

-- 5. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_movies_updated_at ON public.movies;
CREATE TRIGGER set_movies_updated_at
BEFORE UPDATE ON public.movies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Allow ANY public user/visitor to READ active movies only
CREATE POLICY "Public can view active movies"
ON public.movies
FOR SELECT
USING (status = 'active');

-- Restrict INSERT/UPDATE/DELETE to authenticated Service Role (our Sync script)
CREATE POLICY "Service role has full management access"
ON public.movies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
