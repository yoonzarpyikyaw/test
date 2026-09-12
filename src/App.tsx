import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  RefreshCw,
  Sparkles,
  Tv,
  Film,
  AlertCircle,
  ChevronRight,
  SlidersHorizontal,
  Send,
  Globe2,
} from 'lucide-react';
import type { Movie, TabType } from './types';
import {
  parseGoogleSheetCSV,
  normalizeGoogleSheetUrl,
  DEFAULT_SHEET_URL,
} from './utils/csvParser';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MovieCard } from './components/MovieCard';
import { MovieDetail } from './components/MovieDetail';
import { SkeletonLoader } from './components/SkeletonLoader';
import { CodeModal } from './components/CodeModal';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { fetchMoviesFromSupabase, getSupabaseConfig } from './services/supabase';
import { INITIAL_CATALOG_MOVIES, FEATURED_HERO_MOVIE } from './data/catalog';

const CACHE_KEY = 'movieflix_sheet_catalog_v5';

export default function App() {
  const [dataSource, setDataSource] = useState<'supabase' | 'sheets' | 'catalog'>('sheets');
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    const saved = localStorage.getItem('movieflix_sheet_url');
    if (!saved) return DEFAULT_SHEET_URL;
    return normalizeGoogleSheetUrl(saved);
  });

  // Master movies state: initialize with cached sheet items if available
  const [movies, setMovies] = useState<Movie[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => movies.length === 0);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Routing State
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestionsFilter, setSuggestionsFilter] = useState<'Suggestions' | 'Recommended' | 'Most Watched'>('Suggestions');
  const [latestMoviesFilter, setLatestMoviesFilter] = useState<string>('All');
  const [latestSeriesFilter, setLatestSeriesFilter] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedLetter, setSelectedLetter] = useState<string>('All');

  // Modals State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Synchronize route with hash
  const syncRouteFromHash = useCallback(() => {
    const rawHash = window.location.hash || '';
    if (rawHash.startsWith('#movie/')) {
      const id = decodeURIComponent(rawHash.slice(7)).trim();
      setSelectedMovieId(id || null);
    } else {
      setSelectedMovieId(null);
      const cleanHash = rawHash.replace('#', '').toLowerCase();
      if (cleanHash === 'tv-series' || cleanHash === 'series') setActiveTab('TV - SERIES');
      else if (cleanHash === 'movies') setActiveTab('MOVIES');
      else if (cleanHash === 'country') setActiveTab('COUNTRY');
      else if (cleanHash === 'a-z') setActiveTab('A - Z LIST');
      else setActiveTab('HOME');
    }
  }, []);

  useEffect(() => {
    syncRouteFromHash();
    window.addEventListener('hashchange', syncRouteFromHash);
    window.addEventListener('popstate', syncRouteFromHash);
    return () => {
      window.removeEventListener('hashchange', syncRouteFromHash);
      window.removeEventListener('popstate', syncRouteFromHash);
    };
  }, [syncRouteFromHash]);

  const navigateToTab = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedMovieId(null);
    setSearchQuery('');
    if (tab === 'HOME') {
      window.location.hash = '#home';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'TV - SERIES') {
      window.location.hash = '#tv-series';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'MOVIES') {
      window.location.hash = '#movies';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'COUNTRY') {
      window.location.hash = '#country';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'A - Z LIST') {
      window.location.hash = '#a-z';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openMovie = (movie: Movie) => {
    setSelectedMovieId(movie.id);
    window.location.hash = `#movie/${encodeURIComponent(movie.id)}`;
  };

  const closeMovieDetail = () => {
    setSelectedMovieId(null);
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateToTab('HOME');
    }
  };

  // Resilient fetch from Google Sheet and Supabase (STRICTLY user's data only)
  const fetchSheetData = useCallback(async (customUrl?: string) => {
    setIsBackgroundFetching(true);
    if (movies.length === 0) {
      setIsLoading(true);
    }
    setError(null);

    const targetUrl = normalizeGoogleSheetUrl(customUrl || sheetUrl);

    try {
      // Step 1: Check Supabase PostgreSQL first if configured
      const supabaseConfig = getSupabaseConfig();
      if (supabaseConfig.isConfigured) {
        const supabaseMovies = await fetchMoviesFromSupabase();
        if (supabaseMovies && supabaseMovies.length > 0) {
          setMovies(supabaseMovies);
          setDataSource('supabase');
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(supabaseMovies));
          } catch {}
          return;
        }
      }

      // Step 2: Fetch user Google Sheet CSV
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          if (!text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
            const parsed = parseGoogleSheetCSV(text);
            if (parsed.length > 0) {
              setMovies(parsed);
              setDataSource('sheets');
              try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
              } catch {}
              return;
            }
          }
        }
      } catch (sheetErr) {
        console.warn('Google Sheet fetch error:', sheetErr);
      }

      // Step 3: Fallback to bundled snapshot of user Google Sheet
      try {
        const fallbackRes = await fetch('/fallback_catalog.csv');
        if (fallbackRes.ok) {
          const fbText = await fallbackRes.text();
          const parsedFallback = parseGoogleSheetCSV(fbText);
          if (parsedFallback.length > 0) {
            setMovies(parsedFallback);
            setDataSource('sheets');
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(parsedFallback));
            } catch {}
            return;
          }
        }
      } catch (fbErr) {
        console.warn('Fallback catalog error:', fbErr);
      }

      if (movies.length === 0) {
        setError('Google Sheet မှ ဒေတာမရယူနိုင်ပါ။ အင်တာနက်လိုင်း သို့မဟုတ် Google Sheet လင့်ခ်ကို စစ်ဆေးပေးပါ။');
      }
    } catch (err) {
      console.warn('Data fetch error:', err);
      if (movies.length === 0) {
        setError('Google Sheet သို့ ဆက်သွယ်ရာတွင် အဆင်မပြေဖြစ်နေပါသည်။');
      }
    } finally {
      setIsBackgroundFetching(false);
      setIsLoading(false);
    }
  }, [sheetUrl, movies.length]);

  useEffect(() => {
    fetchSheetData();
  }, [fetchSheetData]);

  // Find selected movie for detail modal
  const currentMovie = useMemo(() => {
    if (!selectedMovieId) return null;
    return movies.find((m) => m.id === selectedMovieId) || null;
  }, [selectedMovieId, movies]);

  // Featured Hero movie from user's sheet (pinned or trending or first movie)
  const heroMovie = useMemo(() => {
    if (movies.length === 0) return null;
    const pinned = movies.find(
      (m) => m.pin === '1' || m.pin?.toLowerCase() === 'pin' || m.pin === 'true'
    );
    if (pinned) return pinned;

    const trending = movies.find(
      (m) => m.trending === '1' || m.category?.toLowerCase().includes('trend')
    );
    if (trending) return trending;

    return movies[0];
  }, [movies]);

  // Filter 1: Suggestions Movies from user's sheet
  const suggestionsList = useMemo(() => {
    if (movies.length === 0) return [];
    let list = movies.filter((m) => m.category?.toLowerCase().includes('suggest') || m.trending === '1');
    if (list.length === 0) {
      list = heroMovie ? movies.filter((m) => m.id !== heroMovie.id) : movies;
    }
    if (suggestionsFilter === 'Recommended') {
      return [...list].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 16);
    }
    if (suggestionsFilter === 'Most Watched') {
      return [...list].reverse().slice(0, 16);
    }
    return list.slice(0, 16);
  }, [movies, heroMovie, suggestionsFilter]);

  // Dynamic movie genres from user's sheet
  const movieGenres = useMemo(() => {
    const allM = movies.filter(
      (m) => m.type?.toLowerCase() !== 'series' && !m.category?.toLowerCase().includes('series')
    );
    const set = new Set<string>();
    allM.forEach((s) => {
      (s.genre || '').split(/[,/]/).forEach((g) => {
        const trimmed = g.trim();
        if (trimmed) set.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase());
      });
    });
    return ['All', ...Array.from(set).slice(0, 4)];
  }, [movies]);

  // Filter 2: Latest Movies from user's sheet
  const latestMoviesList = useMemo(() => {
    const list = movies.filter(
      (m) => m.type?.toLowerCase() !== 'series' && !m.category?.toLowerCase().includes('series')
    );
    if (latestMoviesFilter === 'All') {
      return list.slice(0, 16);
    }
    return list
      .filter((m) => (m.genre || '').toLowerCase().includes(latestMoviesFilter.toLowerCase()))
      .slice(0, 16);
  }, [movies, latestMoviesFilter]);

  // Dynamic series genres from user's sheet
  const seriesGenres = useMemo(() => {
    const allS = movies.filter(
      (m) => m.type?.toLowerCase() === 'series' || m.category?.toLowerCase().includes('series') || Boolean(m.episode)
    );
    const set = new Set<string>();
    allS.forEach((s) => {
      (s.genre || '').split(/[,/]/).forEach((g) => {
        const trimmed = g.trim();
        if (trimmed) set.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase());
      });
    });
    return ['All', ...Array.from(set).slice(0, 4)];
  }, [movies]);

  // Filter 3: Latest TV-Series (STRICTLY user's sheet TV series)
  const latestSeriesList = useMemo(() => {
    const list = movies.filter(
      (m) => m.type?.toLowerCase() === 'series' || m.category?.toLowerCase().includes('series') || Boolean(m.episode)
    );
    if (latestSeriesFilter === 'All') {
      return list;
    }
    return list.filter((m) =>
      (m.genre || '').toLowerCase().includes(latestSeriesFilter.toLowerCase())
    );
  }, [movies, latestSeriesFilter]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.genre && m.genre.toLowerCase().includes(q)) ||
        (m.year && m.year.includes(q)) ||
        (m.synopsis && m.synopsis.toLowerCase().includes(q))
    );
  }, [searchQuery, movies]);

  // Country Filtered Movies
  const countryMovies = useMemo(() => {
    if (selectedCountry === 'All') return movies;
    return movies.filter((m) =>
      (m.language || '').toLowerCase().includes(selectedCountry.toLowerCase()) ||
      (m.genre || '').toLowerCase().includes(selectedCountry.toLowerCase())
    );
  }, [movies, selectedCountry]);

  // A-Z Filtered Movies
  const azMovies = useMemo(() => {
    if (selectedLetter === 'All') {
      return [...movies].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (selectedLetter === '#') {
      return movies.filter((m) => /^[0-9]/.test(m.title.trim()));
    }
    return movies.filter((m) =>
      m.title.trim().toUpperCase().startsWith(selectedLetter)
    );
  }, [movies, selectedLetter]);

  const alphabet = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
  const countries = ['All', 'USA', 'UK', 'Korea', 'Japan', 'Thailand', 'China', 'India', 'Myanmar'];

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-gray-900 selection:bg-green-600 selection:text-white flex flex-col font-sans">
      
      {/* 1. Header Navigation matching uploaded screenshot */}
      <Navbar
        activeTab={activeTab}
        onTabChange={navigateToTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        dataSourceLabel={dataSource === 'supabase' ? 'PostgreSQL' : dataSource === 'sheets' ? 'Sheets' : undefined}
      />

      {/* 2. Main Content Container */}
      <main className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-5 w-full space-y-7 flex-1">
        
        {/* If Movie is Selected, Render Movie Detail View */}
        {currentMovie ? (
          <MovieDetail
            movie={currentMovie}
            allMovies={movies}
            onBack={closeMovieDetail}
            onSelectMovie={openMovie}
          />
        ) : searchQuery.trim() ? (
          /* Search Results View */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <div>
                <h2 className="text-lg font-black text-gray-950">
                  Search Results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Found {searchResults.length} title{searchResults.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-gray-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
                {searchResults.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => openMovie(movie)}
                    showEpisodeBadge={movie.type === 'series'}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-2xs space-y-3">
                <Search className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-sm font-bold text-gray-700">No movies or series found</h3>
                <p className="text-xs text-gray-400">Try searching for another title, actor, or genre.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'COUNTRY' ? (
          /* COUNTRY Tab View */
          <div className="space-y-5">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-green-600" />
                <h2 className="text-base font-black text-gray-950">Browse by Country & Language</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {countries.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCountry(c)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      selectedCountry === c
                        ? 'bg-green-600 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
              {countryMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => openMovie(movie)}
                />
              ))}
            </div>
          </div>
        ) : activeTab === 'A - Z LIST' ? (
          /* A - Z LIST Tab View */
          <div className="space-y-5">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <h2 className="text-base font-black text-gray-950">Browse Alphabetically (A - Z)</h2>
              <div className="flex flex-wrap gap-1.5">
                {alphabet.map((letter) => (
                  <button
                    key={letter}
                    onClick={() => setSelectedLetter(letter)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold rounded-md transition-colors ${
                      selectedLetter === letter
                        ? 'bg-green-600 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
              {azMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => openMovie(movie)}
                />
              ))}
            </div>
          </div>
        ) : activeTab === 'TV - SERIES' ? (
          /* TV - SERIES Tab View */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="bg-[#5cb85c] text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-md flex items-center gap-1 shadow-xs">
                  Latest TV-Series &gt;
                </span>
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                  {latestSeriesList.length} Series available
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {seriesGenres.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLatestSeriesFilter(filter)}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      latestSeriesFilter === filter
                        ? 'bg-white text-gray-900 border border-gray-300 shadow-2xs'
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
              {latestSeriesList.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => openMovie(movie)}
                />
              ))}
            </div>
          </div>
        ) : activeTab === 'MOVIES' ? (
          /* MOVIES Tab View */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="bg-[#5cb85c] text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-md flex items-center gap-1 shadow-xs">
                  Latest Movies &gt;
                </span>
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                  {latestMoviesList.length} Movies available
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {movieGenres.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLatestMoviesFilter(filter)}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      latestMoviesFilter === filter
                        ? 'bg-white text-gray-900 border border-gray-300 shadow-2xs'
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
              {latestMoviesList.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => openMovie(movie)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* HOME View (Exact 100% Match to the Reference Screenshot!) */
          <>
            {/* 1. Hero Spotlight Banner (Moana) */}
            <Hero
              movie={heroMovie}
              onWatchNow={(m) => {
                if (m.tgLink) {
                  window.open(m.tgLink, '_blank', 'noopener,noreferrer');
                } else {
                  openMovie(m);
                }
              }}
              onMoreInfo={(m) => openMovie(m)}
            />

            {/* 2. Section 1: Suggestions */}
            <section className="space-y-3 pt-2">
              {/* Header Bar with Tabs: Suggestions > | Recommended | Most Watched This Month */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSuggestionsFilter('Suggestions')}
                  className={`font-bold text-xs sm:text-sm px-4 py-1.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                    suggestionsFilter === 'Suggestions'
                      ? 'bg-[#5cb85c] text-white shadow-xs'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                >
                  Suggestions &gt;
                </button>
                <button
                  onClick={() => setSuggestionsFilter('Recommended')}
                  className={`font-semibold text-xs sm:text-sm px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                    suggestionsFilter === 'Recommended'
                      ? 'bg-[#5cb85c] text-white shadow-xs'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                >
                  Recommended
                </button>
                <button
                  onClick={() => setSuggestionsFilter('Most Watched')}
                  className={`font-medium text-xs sm:text-sm px-3 py-1.5 transition-colors cursor-pointer ${
                    suggestionsFilter === 'Most Watched'
                      ? 'text-green-600 font-bold'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Most Watched This Month
                </button>
              </div>

              {/* 8-column Movie Grid (Row 1 & Row 2 = 16 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
                {suggestionsList.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => openMovie(movie)}
                  />
                ))}
              </div>
            </section>

            {/* 3. Section 2: Latest Movies */}
            <section className="space-y-3 pt-2">
              {/* Header Bar: Latest Movies > | All | Action | Comedy | Horror | View more >> */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button
                    onClick={() => navigateToTab('MOVIES')}
                    className="bg-[#5cb85c] hover:bg-green-700 text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-md flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    Latest Movies &gt;
                  </button>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {movieGenres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => setLatestMoviesFilter(genre)}
                        className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                          latestMoviesFilter === genre
                            ? 'bg-white text-gray-900 border border-gray-300 font-bold shadow-2xs'
                            : 'text-gray-600 hover:text-green-600'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => navigateToTab('MOVIES')}
                  className="text-xs font-semibold text-[#5cb85c] hover:underline flex items-center cursor-pointer"
                >
                  View more &gt;&gt;
                </button>
              </div>

              {/* 8-column Movie Grid (Row 1 & Row 2 = 16 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
                {latestMoviesList.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => openMovie(movie)}
                  />
                ))}
              </div>
            </section>

            {/* 4. Section 3: Latest TV-Series */}
            <section className="space-y-3 pt-2 pb-6">
              {/* Header Bar: Latest TV-Series > | All | Action | Comedy | Sci-Fi | View more >> */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button
                    onClick={() => navigateToTab('TV - SERIES')}
                    className="bg-[#5cb85c] hover:bg-green-700 text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-md flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    Latest TV-Series &gt;
                  </button>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {seriesGenres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => setLatestSeriesFilter(genre)}
                        className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                          latestSeriesFilter === genre
                            ? 'bg-white text-gray-900 border border-gray-300 font-bold shadow-2xs'
                            : 'text-gray-600 hover:text-green-600'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => navigateToTab('TV - SERIES')}
                  className="text-xs font-semibold text-[#5cb85c] hover:underline flex items-center cursor-pointer"
                >
                  View more &gt;&gt;
                </button>
              </div>

              {/* 8-column Movie Grid (Row 1 & Row 2 = 16 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
                {latestSeriesList.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => openMovie(movie)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Database & Sync Settings Modal */}
      <SheetSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSheetUrl={sheetUrl}
        onSaveSheetUrl={(newUrl) => {
          setSheetUrl(newUrl);
          fetchSheetData(newUrl);
        }}
        onRefreshData={() => fetchSheetData()}
      />

      {/* Standalone Code Export Modal */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        movies={movies}
        sheetUrl={sheetUrl}
      />
    </div>
  );
}
