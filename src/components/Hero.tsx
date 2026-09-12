import React from 'react';
import { Play, Info, Plus, Flame, Check } from 'lucide-react';
import type { Movie } from '../types';

interface HeroProps {
  movie: Movie | null;
  onWatchNow: (movie: Movie) => void;
  onMoreInfo: (movie: Movie) => void;
}

export const Hero: React.FC<HeroProps> = ({ movie, onWatchNow, onMoreInfo }) => {
  const [inWatchlist, setInWatchlist] = React.useState(false);

  if (!movie) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-[#08121e] min-h-[340px] md:min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading catalog...</span>
        </div>
      </div>
    );
  }

  const backdropImage =
    movie.backdrop ||
    movie.poster ||
    'https://image.tmdb.org/t/p/original/6t8g20vXfJpI35bS8N2iB41l4yY.jpg';

  const genresList = movie.genre
    ? movie.genre.split(',').map((g) => g.trim())
    : ['Animation', 'Adventure', 'Family'];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-[#08121e] min-h-[380px] md:min-h-[430px] flex items-center">
      {/* Background Image with Layered Gradient Mask */}
      <div className="absolute inset-0 z-0">
        <img
          src={backdropImage}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-110"
        />
        {/* Exact gradient overlay matching reference image */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08121e] via-[#08121ee6] via-45% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08121e] via-transparent to-transparent" />
      </div>

      {/* Content Grid */}
      <div className="relative z-10 w-full p-6 sm:p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-10">
        
        {/* Left Information Block */}
        <div className="flex-1 max-w-2xl text-left space-y-3.5 sm:space-y-4">
          
          {/* Top Pill: Fire icon + MOST LOVED THIS MONTH • duration */}
          <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-[#e50914] text-white shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-white" />
              MOST LOVED THIS MONTH
            </span>
            <span className="text-zinc-400 font-semibold">• {movie.duration || '1h 47m'}</span>
          </div>

          {/* Big Bold Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {movie.title}
          </h1>

          {/* Metadata: Year | Genre 1 | Genre 2 | GENRE 3 (FAMILY) */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-300">
            <span>{movie.year || '2016'}</span>
            <span className="text-zinc-500">|</span>
            {genresList.map((g, idx) => {
              const isLast = idx === genresList.length - 1;
              return (
                <React.Fragment key={g}>
                  <span className={isLast ? 'text-yellow-400 font-black uppercase tracking-wider' : 'text-zinc-300'}>
                    {g}
                  </span>
                  {!isLast && <span className="text-zinc-500">|</span>}
                </React.Fragment>
              );
            })}
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed max-w-xl font-normal">
            {movie.synopsis ||
              'Moana, a spirited teenager, sets sail on a daring journey to save her people and discover her true identity.'}
          </p>

          {/* 3 Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Watch Now Button */}
            <button
              onClick={() => onWatchNow(movie)}
              className="flex items-center gap-2 bg-[#e50914] hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-md shadow-md transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Now</span>
            </button>

            {/* More Info Button */}
            <button
              onClick={() => onMoreInfo(movie)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-md backdrop-blur-sm transition-all cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>More Info</span>
            </button>

            {/* Add to Watchlist Button */}
            <button
              onClick={() => setInWatchlist(!inWatchlist)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-md backdrop-blur-sm transition-all cursor-pointer"
            >
              {inWatchlist ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Floating Poster Card */}
        <div className="hidden md:block shrink-0">
          <div
            onClick={() => onMoreInfo(movie)}
            className="w-56 lg:w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-white/15 cursor-pointer transform hover:scale-105 transition-transform duration-300 relative group bg-zinc-900"
          >
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="eager"
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
  );
};
