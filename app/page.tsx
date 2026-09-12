'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Send,
  Play,
  Info,
  Plus,
  Flame,
  Globe2,
  Check,
  X,
} from 'lucide-react';
import { supabase, MovieRecord } from '../lib/supabase';
import {
  parseGoogleSheetCsvToDisplayMovies,
  DisplayMovie,
} from '../lib/initialCatalog';

type TabType = 'HOME' | 'TV - SERIES' | 'MOVIES' | 'COUNTRY' | 'A - Z LIST';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVSH71Wsy2hyuWwPjsOvDsxZTtdU5x9qGKcDmICqaK4TyjgxJIA6c9bf9-WGhlkifD9xm3E9lYEz9q/pub?output=csv';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<DisplayMovie | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);

  // Filters
  const [suggestionsFilter, setSuggestionsFilter] = useState<'Suggestions' | 'Recommended' | 'Most Watched'>('Suggestions');
  const [latestMoviesFilter, setLatestMoviesFilter] = useState<string>('All');
  const [latestSeriesFilter, setLatestSeriesFilter] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedLetter, setSelectedLetter] = useState('All');

  // Live movies state
  const [liveMovies, setLiveMovies] = useState<DisplayMovie[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Try Supabase PostgreSQL first
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .eq('status', 'active')
          .order('pin', { ascending: false })
          .order('year', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: DisplayMovie[] = data.map((rec: MovieRecord) => ({
            id: rec.slug || rec.id,
            title: rec.title,
            year: rec.year ? String(rec.year) : '2026',
            genre: Array.isArray(rec.genres) ? rec.genres.join(', ') : 'Action',
            poster: rec.poster_url || 'https://image.tmdb.org/t/p/w500/v3QOQU2HG0v61BMRDnc3Y16tC6K.jpg',
            backdrop: rec.backdrop_url || undefined,
            tgLink: rec.tg_link || 'https://t.me/addlist/58gZNGQ86uJiOWE9',
            type: rec.type === 'series' ? 'series' : 'movie',
            quality: rec.quality || 'HD',
            rating: rec.rating ? String(rec.rating) : undefined,
            duration: rec.duration ? `${Math.floor(rec.duration / 60)}h ${rec.duration % 60}m` : undefined,
            synopsis: rec.synopsis || rec.overview || undefined,
          }));
          setLiveMovies(mapped);
          return;
        }

        // 2. Fetch Google Sheet CSV fallback
        const res = await fetch(SHEET_CSV_URL);
        if (res.ok) {
          const text = await res.text();
          const items = parseGoogleSheetCsvToDisplayMovies(text);
          if (items.length > 0) {
            setLiveMovies(items);
            return;
          }
        }
      } catch (e) {
        console.warn('Data fetch notice:', e);
      }
    }
    loadData();
  }, []);

  const allMoviesList = liveMovies;

  // Hero movie from user's live list (pinned or first)
  const heroMovie = useMemo(() => {
    if (allMoviesList.length > 0) {
      const pinned = allMoviesList.find((m) => m.type === 'movie');
      if (pinned) return pinned;
      return allMoviesList[0];
    }
    return null;
  }, [allMoviesList]);

  const suggestionsList = useMemo(() => {
    const list = allMoviesList.filter((m) => m.type === 'movie');
    if (suggestionsFilter === 'Recommended') {
      return [...list].reverse().slice(0, 16);
    }
    return list.slice(0, 16);
  }, [allMoviesList, suggestionsFilter]);

  const latestMoviesList = useMemo(() => {
    const list = allMoviesList.filter((m) => m.type === 'movie');
    if (latestMoviesFilter === 'All') return list.slice(0, 16);
    return list
      .filter((m) => m.genre.toLowerCase().includes(latestMoviesFilter.toLowerCase()))
      .slice(0, 16);
  }, [allMoviesList, latestMoviesFilter]);

  const latestSeriesList = useMemo(() => {
    const list = allMoviesList.filter((m) => m.type === 'series' || Boolean(m.episode));
    if (latestSeriesFilter === 'All') return list;
    return list
      .filter((m) => m.genre.toLowerCase().includes(latestSeriesFilter.toLowerCase()));
  }, [allMoviesList, latestSeriesFilter]);

  // Dynamic genres from user sheet
  const seriesGenres = useMemo(() => {
    const list = allMoviesList.filter((m) => m.type === 'series' || Boolean(m.episode));
    const set = new Set<string>();
    list.forEach((s) => {
      (s.genre || '').split(/[,/]/).forEach((g) => {
        const trimmed = g.trim();
        if (trimmed) set.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase());
      });
    });
    return ['All', ...Array.from(set).slice(0, 4)];
  }, [allMoviesList]);

  const movieGenres = useMemo(() => {
    const list = allMoviesList.filter((m) => m.type === 'movie');
    const set = new Set<string>();
    list.forEach((s) => {
      (s.genre || '').split(/[,/]/).forEach((g) => {
        const trimmed = g.trim();
        if (trimmed) set.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase());
      });
    });
    return ['All', ...Array.from(set).slice(0, 4)];
  }, [allMoviesList]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allMoviesList.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genre.toLowerCase().includes(q) ||
        m.year.includes(q)
    );
  }, [searchQuery, allMoviesList]);

  const countries = ['All', 'USA', 'UK', 'Korea', 'Japan', 'Thailand', 'China', 'India', 'Myanmar'];
  const alphabet = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  const countryFiltered = useMemo(() => {
    if (selectedCountry === 'All') return allMoviesList;
    return allMoviesList.filter((m) => m.genre.toLowerCase().includes(selectedCountry.toLowerCase()));
  }, [selectedCountry, allMoviesList]);

  const azFiltered = useMemo(() => {
    if (selectedLetter === 'All') return [...allMoviesList].sort((a, b) => a.title.localeCompare(b.title));
    if (selectedLetter === '#') return allMoviesList.filter((m) => /^[0-9]/.test(m.title.trim()));
    return allMoviesList.filter((m) => m.title.trim().toUpperCase().startsWith(selectedLetter));
  }, [selectedLetter, allMoviesList]);

  const renderCard = (movie: DisplayMovie, showEps?: boolean) => {
    const quality = (movie.quality || 'HD').toUpperCase();
    const episodeNum = movie.episode ? movie.episode.replace(/[^0-9]/g, '') : '1';

    return (
      <div
        key={movie.id}
        onClick={() => setSelectedMovie(movie)}
        className="group relative cursor-pointer select-none rounded-md overflow-hidden bg-zinc-950 aspect-[2/3] shadow-xs hover:shadow-xl transition-all duration-300 hover:scale-[1.04] border border-black/10"
      >
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
          loading="lazy"
        />

        {/* TV Series Episode Circle Badge */}
        {(showEps || movie.type === 'series' || movie.episode) && (
          <div className="absolute top-1.5 left-1.5 z-20">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#5cb85c] text-white flex flex-col items-center justify-center shadow-md border border-white/20">
              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter leading-none">EPS</span>
              <span className="text-[9px] sm:text-[10px] font-black leading-none">{episodeNum}</span>
            </div>
          </div>
        )}

        {/* Quality Badge */}
        <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1">
          {quality.includes('DVD') && (
            <span className="bg-[#f5c518] text-black font-black text-[9px] px-1.5 py-0.5 rounded-xs uppercase tracking-tight shadow-xs">
              DVD
            </span>
          )}
          {quality.includes('HD') && (
            <span className="bg-[#5cb85c] text-white font-black text-[9px] px-1.5 py-0.5 rounded-xs uppercase tracking-tight shadow-xs">
              HD
            </span>
          )}
          {quality.includes('CAM') && (
            <span className="bg-[#f59e0b] text-black font-black text-[9px] px-1.5 py-0.5 rounded-xs uppercase tracking-tight shadow-xs">
              CAM
            </span>
          )}
          {quality.includes('TS') && (
            <span className="bg-[#eab308] text-black font-black text-[9px] px-1.5 py-0.5 rounded-xs uppercase tracking-tight shadow-xs">
              TS
            </span>
          )}
        </div>

        {/* Center Hover Play */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
          <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom Title Bar */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/85 to-transparent pt-6 pb-1.5 px-1 text-center">
          <p className="text-[11px] sm:text-xs font-bold text-white truncate px-1 text-center leading-tight">
            {movie.title}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-gray-900 flex flex-col font-sans">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200/90 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo Section */}
          <button
            onClick={() => setActiveTab('HOME')}
            className="text-left flex flex-col justify-center cursor-pointer group"
          >
            <span className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight leading-none group-hover:text-green-700 transition-colors">
              Family Version
            </span>
            <span className="text-[11px] text-gray-400 font-normal tracking-tight mt-1">
              Watch Your Favorite Movies Online!
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            {(['HOME', 'TV - SERIES', 'MOVIES', 'COUNTRY', 'A - Z LIST'] as TabType[]).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs sm:text-[13px] font-bold tracking-wider py-2 relative transition-all cursor-pointer ${
                    isActive ? 'text-green-600 font-extrabold' : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-green-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Search Box & Telegram Link */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for Movies & TV Shows"
                className="w-44 sm:w-64 lg:w-72 pl-3.5 pr-8 py-1.5 text-xs bg-white text-gray-800 placeholder-gray-400 border border-gray-200 rounded-md focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-green-600 absolute right-2.5 pointer-events-none" />
            </div>

            <a
              href="https://t.me/addlist/58gZNGQ86uJiOWE9"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 bg-[#e50914] hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-5 w-full space-y-7 flex-1">
        {searchQuery.trim() ? (
          /* Search Results */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <h2 className="text-lg font-black text-gray-950">
                Search Results for &ldquo;{searchQuery}&rdquo; ({searchResults.length})
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-gray-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
              {searchResults.map((m) => renderCard(m, m.type === 'series'))}
            </div>
          </div>
        ) : activeTab === 'COUNTRY' ? (
          /* COUNTRY Tab */
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
              {countryFiltered.map((m) => renderCard(m, m.type === 'series'))}
            </div>
          </div>
        ) : activeTab === 'A - Z LIST' ? (
          /* A - Z LIST Tab */
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
              {azFiltered.map((m) => renderCard(m, m.type === 'series'))}
            </div>
          </div>
        ) : activeTab === 'TV - SERIES' ? (
          /* TV - SERIES Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-2xs">
              <span className="bg-[#5cb85c] text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-md shadow-xs">
                Latest TV-Series &gt;
              </span>
              <div className="flex items-center gap-1 text-xs font-medium">
                {seriesGenres.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLatestSeriesFilter(filter)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      latestSeriesFilter === filter
                        ? 'bg-white text-gray-900 border border-gray-300 font-bold shadow-2xs'
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
              {latestSeriesList.map((m) => renderCard(m, true))}
            </div>
          </div>
        ) : activeTab === 'MOVIES' ? (
          /* MOVIES Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-2xs">
              <span className="bg-[#5cb85c] text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-md shadow-xs">
                Latest Movies &gt;
              </span>
              <div className="flex items-center gap-1 text-xs font-medium">
                {movieGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setLatestMoviesFilter(genre)}
                    className={`px-3 py-1 rounded-md transition-colors ${
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
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
              {latestMoviesList.map((m) => renderCard(m, false))}
            </div>
          </div>
        ) : (
          /* HOME Tab */
          <>
            {/* Hero Card */}
            {heroMovie ? (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-[#08121e] min-h-[380px] md:min-h-[430px] flex items-center">
                <div className="absolute inset-0 z-0">
                  <img
                    src={heroMovie.backdrop || heroMovie.poster}
                    alt={heroMovie.title}
                    className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#08121e] via-[#08121ee6] via-45% to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08121e] via-transparent to-transparent" />
                </div>

                <div className="relative z-10 w-full p-6 sm:p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-10">
                  <div className="flex-1 max-w-2xl text-left space-y-3.5 sm:space-y-4">
                    <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-[#e50914] text-white shadow-sm">
                        <Flame className="w-3.5 h-3.5 fill-white" />
                        MOST LOVED THIS MONTH
                      </span>
                      <span className="text-zinc-400 font-semibold">• {heroMovie.duration || '1h 47m'}</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                      {heroMovie.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-300">
                      <span>{heroMovie.year}</span>
                      <span className="text-zinc-500">|</span>
                      <span>{heroMovie.genre || 'Action'}</span>
                      <span className="text-zinc-500">|</span>
                      <span className="text-yellow-400 font-black uppercase tracking-wider">FAMILY</span>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed max-w-xl font-normal">
                      {heroMovie.synopsis}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <a
                        href={heroMovie.tgLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#e50914] hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-md shadow-md transition-all"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Watch Now</span>
                      </a>

                      <button
                        onClick={() => setSelectedMovie(heroMovie)}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-md backdrop-blur-sm transition-all cursor-pointer"
                      >
                        <Info className="w-4 h-4" />
                        <span>More Info</span>
                      </button>

                      <button
                        onClick={() => setInWatchlist(!inWatchlist)}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-md backdrop-blur-sm transition-all cursor-pointer"
                      >
                        {inWatchlist ? <Check className="w-4 h-4 text-green-400" /> : <Plus className="w-4 h-4" />}
                        <span>{inWatchlist ? 'Added' : 'Add to Watchlist'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="hidden md:block shrink-0">
                    <div
                      onClick={() => setSelectedMovie(heroMovie)}
                      className="w-56 lg:w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-white/15 cursor-pointer transform hover:scale-105 transition-transform duration-300 relative group bg-zinc-900"
                    >
                      <img
                        src={heroMovie.poster}
                        alt={heroMovie.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Section 1: Suggestions */}
            <section className="space-y-3 pt-2">
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

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
                {suggestionsList.map((m) => renderCard(m, m.type === 'series'))}
              </div>
            </section>

            {/* Section 2: Latest Movies */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button
                    onClick={() => setActiveTab('MOVIES')}
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
                  onClick={() => setActiveTab('MOVIES')}
                  className="text-xs font-semibold text-[#5cb85c] hover:underline flex items-center cursor-pointer"
                >
                  View more &gt;&gt;
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
                {latestMoviesList.map((m) => renderCard(m, false))}
              </div>
            </section>

            {/* Section 3: Latest TV-Series */}
            <section className="space-y-3 pt-2 pb-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button
                    onClick={() => setActiveTab('TV - SERIES')}
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
                  onClick={() => setActiveTab('TV - SERIES')}
                  className="text-xs font-semibold text-[#5cb85c] hover:underline flex items-center cursor-pointer"
                >
                  View more &gt;&gt;
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-3.5">
                {latestSeriesList.map((m) => renderCard(m, true))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Movie Details Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative bg-[#0d141e] text-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-white/10 my-8">
            <button
              onClick={() => setSelectedMovie(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Poster Header */}
            <div className="relative h-56 sm:h-64 w-full">
              <img
                src={selectedMovie.backdrop || selectedMovie.poster}
                alt={selectedMovie.title}
                className="w-full h-full object-cover filter brightness-[0.4]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d141e] to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4">
                <img
                  src={selectedMovie.poster}
                  alt={selectedMovie.title}
                  className="w-20 sm:w-24 aspect-[2/3] rounded-lg shadow-xl object-cover border-2 border-white/20 shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black">{selectedMovie.title}</h3>
                  <p className="text-xs text-zinc-400">
                    {selectedMovie.year} • {selectedMovie.genre}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {selectedMovie.synopsis || 'Explore this title and stream directly through Telegram.'}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <a
                  href={selectedMovie.tgLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#e50914] hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Watch on Telegram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
