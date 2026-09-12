import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isValidHttpUrl = (str: string) => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(
  rawUrl &&
    rawKey &&
    isValidHttpUrl(rawUrl) &&
    !rawUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl, rawKey)
  : null;

export interface MovieRecord {
  id: string;
  slug: string;
  tmdb_id: number | null;
  title: string;
  original_title: string | null;
  year: number;
  tg_link: string;
  type: string;
  category: string;
  pin: boolean;
  trending: boolean;
  quality: string;
  language: string;
  overview: string | null;
  synopsis: string | null;
  poster_url: string;
  backdrop_url: string | null;
  rating: number | null;
  genres: string[];
  duration: number | null;
  release_date: string | null;
  original_language: string | null;
  age_rating: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
