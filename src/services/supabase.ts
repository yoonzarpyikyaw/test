import { createClient } from '@supabase/supabase-js';
import { Movie } from '../types';

// Client-Safe public configuration (Read-only access via RLS)
const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
const DEFAULT_SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const getSupabaseConfig = () => {
  const customUrl = localStorage.getItem('movieflix_supabase_url');
  const customKey = localStorage.getItem('movieflix_supabase_anon_key');
  return {
    url: customUrl || DEFAULT_SUPABASE_URL,
    anonKey: customKey || DEFAULT_SUPABASE_ANON_KEY,
    isConfigured: Boolean((customUrl || DEFAULT_SUPABASE_URL) && (customKey || DEFAULT_SUPABASE_ANON_KEY) && !(customUrl || DEFAULT_SUPABASE_URL).includes('your-project'))
  };
};

export const setSupabaseConfig = (url: string, anonKey: string) => {
  localStorage.setItem('movieflix_supabase_url', url.trim());
  localStorage.setItem('movieflix_supabase_anon_key', anonKey.trim());
};

export const getSupabaseClient = () => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  return createClient(url, anonKey);
};

/**
 * Normalizes Supabase database row into application Movie interface
 */
export const normalizeSupabaseMovie = (row: any): Movie => {
  const genresStr = Array.isArray(row.genres) 
    ? row.genres.join(', ') 
    : (row.genre || row.genres || 'Action');

  return {
    id: row.id || `${row.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${row.year}`,
    title: row.title || 'Untitled',
    originalTitle: row.original_title || row.title,
    year: row.year ? String(row.year) : '2026',
    genre: genresStr,
    poster: row.poster_url || row.poster || '',
    backdrop: row.backdrop_url || row.backdrop || row.poster_url || '',
    tgLink: row.tg_link || row.tgLink || '',
    category: row.category || 'Discover',
    type: row.type || 'movie',
    pin: row.pin === true || row.pin === 'true' || row.pin === '1' ? 'true' : 'false',
    trending: row.trending === true || row.trending === 'true' || row.trending === '1' ? 'true' : 'false',
    synopsis: row.synopsis || row.overview || '',
    rating: row.rating ? Number(row.rating).toFixed(1) : '',
    quality: row.quality || 'HD',
    language: row.language || 'Myanmar Sub',
    duration: row.duration ? `${row.duration} min` : '',
    ageRating: row.age_rating || 'PG-13',
    status: row.status || 'active'
  };
};

/**
 * Fetches all active movies directly from Supabase PostgreSQL
 */
export const fetchMoviesFromSupabase = async (): Promise<Movie[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('movies')
      .select('*')
      .eq('status', 'active')
      .order('pin', { ascending: false })
      .order('year', { ascending: false });

    if (error) {
      console.warn('Supabase query error:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(normalizeSupabaseMovie);
    }
    return [];
  } catch (err) {
    console.warn('Failed to query Supabase:', err);
    return null;
  }
};
