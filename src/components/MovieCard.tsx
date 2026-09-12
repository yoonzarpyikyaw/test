import React from 'react';
import { Play, Send } from 'lucide-react';
import type { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  showEpisodeBadge?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  // Determine quality badge type
  const quality = (movie.quality || 'HD').toUpperCase();

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer select-none rounded-md overflow-hidden bg-zinc-950 aspect-[2/3] shadow-xs hover:shadow-xl transition-all duration-300 hover:scale-[1.04] border border-black/10"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View ${movie.title}`}
    >
      {/* Poster Image */}
      <img
        src={movie.poster}
        alt={movie.title}
        className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://image.tmdb.org/t/p/w500/v3QOQU2HG0v61BMRDnc3Y16tC6K.jpg';
        }}
      />

      {/* Top Right: Quality Badge (DVD, HD, CAM, TS) */}
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

      {/* Hover Center Play Button */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
        <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </div>
      </div>

      {/* Bottom Title Bar (Exact match to uploaded design) */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/85 to-transparent pt-6 pb-1.5 px-1 text-center">
        <p className="text-[11px] sm:text-xs font-bold text-white truncate px-1 text-center leading-tight">
          {movie.title}
        </p>
      </div>
    </div>
  );
};
