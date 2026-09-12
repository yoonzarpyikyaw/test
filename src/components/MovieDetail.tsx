import React, { useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Calendar,
  Film,
  Star,
  Clock,
  Globe2,
  Tv,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Share2,
} from 'lucide-react';
import type { Movie } from '../types';

interface MovieDetailProps {
  movie: Movie;
  allMovies: Movie[];
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
}

export const MovieDetail: React.FC<MovieDetailProps> = ({
  movie,
  allMovies,
  onBack,
  onSelectMovie,
}) => {
  // Listen to Escape key to navigate back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Scroll to top when movie changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [movie.id]);

  // Find related movies by genre or type, excluding current
  const relatedMovies = React.useMemo(() => {
    const currentGenres = (movie.genre || '')
      .toLowerCase()
      .split(/[/,]/)
      .map((g) => g.trim())
      .filter(Boolean);

    return allMovies
      .filter((m) => {
        if (m.id === movie.id) return false;
        // Same type or sharing a genre
        const isSameType = m.type === movie.type;
        const sharesGenre = currentGenres.some((g) =>
          (m.genre || '').toLowerCase().includes(g)
        );
        return isSameType || sharesGenre;
      })
      .slice(0, 6);
  }, [movie, allMovies]);

  // Backdrop fallback to poster if not explicitly specified
  const heroImage = movie.backdrop || movie.poster;

  return (
    <div className="min-h-screen bg-[#070709] text-white pt-16 pb-20 selection:bg-red-600 selection:text-white">
      {/* Cinematic Hero Backdrop Banner */}
      <div className="relative w-full h-[40vh] sm:h-[55vh] lg:h-[65vh] overflow-hidden bg-black">
        <img
          src={heroImage}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-[0.4] contrast-125 scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Multilayered gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070709] to-transparent" />

        {/* Floating Top Back & Breadcrumb Bar */}
        <div className="absolute top-4 sm:top-6 left-0 right-0 z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-black/70 hover:bg-zinc-800 text-zinc-200 hover:text-white backdrop-blur-xl border border-white/10 transition-all shadow-lg group"
            aria-label="Back to catalog"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs sm:text-sm font-bold">Back to Catalog</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: movie.title,
                    text: `Watch ${movie.title} on MovieFlix Live!`,
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Movie link copied to clipboard!');
                }
              }}
              title="Share Movie Link"
              className="p-2.5 rounded-2xl bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-xl border border-white/10 transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-28 sm:-mt-44 lg:-mt-52 relative z-20">
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
          
          {/* Left Column: High-Res Poster & Instant Watch CTA */}
          <div className="w-full sm:w-72 lg:w-80 shrink-0 mx-auto lg:mx-0">
            <div className="space-y-4">
              {/* Poster Card */}
              <div className="relative aspect-[2/3] w-full rounded-3xl overflow-hidden shadow-2xl shadow-black/90 border-2 border-white/15 bg-zinc-900 group">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Poster Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {movie.type === 'series' ? (
                    <span className="bg-purple-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider">
                      SERIES
                    </span>
                  ) : (
                    <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider">
                      MOVIE
                    </span>
                  )}
                  {movie.quality && (
                    <span className="bg-black/80 backdrop-blur-md text-zinc-200 border border-white/20 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">
                      {movie.quality}
                    </span>
                  )}
                </div>

                {/* Rating Badge (Only if real rating exists) */}
                {movie.rating && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 text-xs font-black text-amber-300 shadow-xl">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{movie.rating}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Watch on Telegram CTA Button */}
              <a
                href={movie.tgLink || 'https://t.me/addlist/58gZNGQ86uJiOWE9'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95 text-center"
              >
                <Send className="w-5 h-5 fill-white" />
                <span>Watch on Telegram</span>
              </a>

              {/* Verified Channel Notice */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center gap-2.5 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified high-speed Telegram stream link. Safe and ad-free.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Metadata, Burmese Synopsis, and Related Titles */}
          <div className="flex-1 space-y-6 text-left w-full">
            {/* Category / Status Tags */}
            <div className="flex flex-wrap items-center gap-2">
              {movie.category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  {movie.category}
                </span>
              )}
              {movie.pin === '1' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ★ Featured Premiere
                </span>
              )}
              {movie.trending === '1' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  🔥 Trending
                </span>
              )}
            </div>

            {/* Title & Original Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {movie.title}
              </h1>
              {movie.originalTitle && (
                <p className="text-sm sm:text-base text-zinc-400 mt-1 font-medium italic">
                  Original title: {movie.originalTitle}
                </p>
              )}
            </div>

            {/* Real Metadata Badges Row (NO fake numbers!) */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-300 font-medium pb-2 border-b border-white/10">
              {movie.year && (
                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{movie.year}</span>
                </span>
              )}

              {movie.type && (
                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg capitalize">
                  {movie.type === 'series' ? (
                    <Tv className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <Film className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span>{movie.type}</span>
                </span>
              )}

              {movie.genre && (
                <span className="text-zinc-200 capitalize">
                  {movie.genre}
                </span>
              )}

              {movie.duration && (
                <span className="flex items-center gap-1 text-zinc-300 bg-white/5 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{movie.duration}</span>
                </span>
              )}

              {movie.language && (
                <span className="flex items-center gap-1 text-zinc-300 bg-white/5 px-2.5 py-1 rounded-lg">
                  <Globe2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{movie.language}</span>
                </span>
              )}

              {movie.ageRating && (
                <span className="border border-white/20 px-2 py-0.5 rounded text-xs font-bold text-zinc-300">
                  {movie.ageRating}
                </span>
              )}

              {/* Rating (Clean display or Neutral state if not provided) */}
              {movie.rating ? (
                <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg font-bold border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{movie.rating} Rating</span>
                </span>
              ) : (
                <span className="text-zinc-500 text-xs">Rating unavailable</span>
              )}
            </div>

            {/* Synopsis Section (Supports full multi-line Burmese story description) */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                <Film className="w-4 h-4" />
                <span>SYNOPSIS / ဇာတ်လမ်းအကျဉ်း</span>
              </h3>

              <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/80 border border-white/10 text-zinc-200 text-sm sm:text-base leading-relaxed whitespace-pre-line select-text font-sans shadow-inner">
                {movie.synopsis && movie.synopsis.trim() ? (
                  movie.synopsis
                ) : (
                  <p className="text-zinc-400 italic">
                    {movie.title} အတွက် အသေးစိတ် ဇာတ်လမ်းအကျဉ်းကို မထည့်သွင်းရသေးပါ။ အထက်ပါ Telegram ခလုတ်မှတစ်ဆင့် တိုက်ရိုက် ကြည့်ရှုနိုင်ပါသည်။
                  </p>
                )}
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Category</span>
                <span className="font-semibold text-zinc-200 capitalize truncate block mt-0.5">
                  {movie.category || 'Cinema'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Content Type</span>
                <span className="font-semibold text-zinc-200 capitalize truncate block mt-0.5">
                  {movie.type || 'Movie'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Audio / Subtitle</span>
                <span className="font-semibold text-zinc-200 truncate block mt-0.5">
                  {movie.language || 'Myanmar Subtitle'}
                </span>
              </div>
            </div>

            {/* Related Titles Section */}
            {relatedMovies.length > 0 && (
              <div className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    More Like This / အလားတူ ဇာတ်ကားများ
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {relatedMovies.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectMovie(item)}
                      className="group cursor-pointer text-left select-none"
                    >
                      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:border-red-500/50 group-hover:shadow-lg">
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-[10px] text-white font-bold truncate">
                            {item.title}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs font-bold text-zinc-300 truncate group-hover:text-red-400">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {item.year}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
