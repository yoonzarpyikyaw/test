export interface Movie {
  id: string;            // Stable unique movie identifier (e.g. 'oppenheimer-2023')
  title: string;         // Movie title
  originalTitle?: string;// Original language title if available
  year: string;          // Release year (e.g. '2026')
  genre: string;         // Movie genres (e.g. 'Action, Sci-Fi')
  poster: string;        // Poster image URL
  backdrop?: string;     // High-resolution backdrop/hero banner URL
  tgLink: string;        // Telegram watch/channel URL
  category: string;      // Category (e.g. 'Trending', 'Popular', 'Discover')
  type?: string;         // 'movie' | 'series'
  pin?: string;          // '1' or 'true' for featured spotlight premiere
  trending?: string;     // '1' or 'true' for explicit trending status
  synopsis?: string;     // Movie description / Burmese synopsis
  rating?: string;       // Real rating from sheet (e.g. '8.4') - NO FAKE METADATA
  quality?: string;      // Real quality from sheet (e.g. '1080p', '4K')
  language?: string;     // Language/subtitles (e.g. 'Myanmar Sub', 'English')
  duration?: string;     // Runtime (e.g. '2h 15m')
  ageRating?: string;    // Age classification (e.g. '18+', 'PG-13')
  status?: string;       // 'active' | 'inactive'
  episode?: string;      // Episode label for TV series (e.g. 'EPS 14', 'EPS 68')
}

export type TabType = 'HOME' | 'TV - SERIES' | 'MOVIES' | 'COUNTRY' | 'A - Z LIST' | 'All' | 'Series' | 'Trending';
