import React, { useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { Movie } from '../types';

interface TrendingRowProps {
  title: string;
  movies: Movie[];
  type: 'movie' | 'series';
  onViewAll: () => void;
  onMovieClick: (movie: Movie) => void;
}

export const TrendingRow: React.FC<TrendingRowProps> = ({
  title,
  movies,
  type,
  onViewAll,
  onMovieClick,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!movies || movies.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="mb-10 w-full relative">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl select-none" role="img" aria-label="flame">
            {type === 'series' ? '📺' : '🔥'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll navigation arrows (previous & next) */}
          <div className="flex items-center gap-1 mr-1">
            <button
              onClick={() => scroll('left')}
              title="Previous"
              aria-label={`Scroll ${title} left`}
              className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              title="Next"
              aria-label={`Scroll ${title} right`}
              className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Blue View All Button */}
          <button
            onClick={onViewAll}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20"
          >
            View All
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Carousel Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-none select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie) => (
          <div
            key={movie.id}
            onClick={() => onMovieClick(movie)}
            className="group shrink-0 w-44 sm:w-52 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 text-left"
          >
            {/* Card Frame */}
            <div className="bg-[#121217] border border-white/10 hover:border-red-500/50 rounded-2xl overflow-hidden shadow-lg transition-all">
              
              {/* Poster Image Container */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400';
                  }}
                />

                {/* Badges on Poster */}
                <div className="absolute top-2 left-2 z-10">
                  {type === 'series' || movie.type === 'series' ? (
                    <span className="bg-purple-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-md uppercase tracking-wider">
                      SERIES
                    </span>
                  ) : (
                    <span className="bg-red-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-md uppercase tracking-wider">
                      {movie.quality || '4K'}
                    </span>
                  )}
                </div>

                {/* Top Right: Real Rating ONLY if present in sheet */}
                {movie.rating && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[11px] font-black text-amber-400 shadow-md">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{movie.rating}</span>
                    </div>
                  </div>
                )}

                {/* Center Hover Play Icon */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Movie Title & Info */}
            <div className="mt-2.5 px-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
                {movie.title}
              </h3>
              <p className="text-[11px] text-zinc-400 capitalize mt-0.5 truncate">
                {movie.genre || 'Cinema'} • {movie.year || '2026'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
