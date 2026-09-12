import React from 'react';
import { X, Send, Play, Calendar, Film, Star, ShieldCheck, Sparkles } from 'lucide-react';
import type { Movie } from '../types';

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export const MovieModal: React.FC<MovieModalProps> = ({ movie, onClose }) => {
  if (!movie) return null;

  const hasBurmeseOrCustomSynopsis = Boolean(movie.synopsis && movie.synopsis.trim().length > 0);

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0e0e13] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-red-950/30 text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background ambient poster glow */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover filter blur-2xl scale-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e13] via-[#0e0e13]/80 to-transparent" />
        </div>

        {/* Modal Header: Title & Badges on Left, Poster prominently visible on Top Right */}
        <div className="relative z-10 p-5 sm:p-7 border-b border-white/10">
          {/* Close Button at top-right corner */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/70 hover:bg-white/20 text-zinc-300 hover:text-white backdrop-blur-md transition-all border border-white/10"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start justify-between gap-4 pt-1 sm:pt-2 pr-10">
            {/* Left Header Details */}
            <div className="flex-1 space-y-2.5">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                {movie.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                    <Sparkles className="w-3 h-3" />
                    {movie.category}
                  </span>
                )}
                {movie.type && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    {movie.type}
                  </span>
                )}
                {movie.pin === '1' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ★ Pinned
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {movie.title}
              </h2>

              {/* Meta Tags Row */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-300 font-medium">
                {movie.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{movie.year}</span>
                  </span>
                )}
                <span>•</span>
                {movie.genre && (
                  <span className="capitalize text-zinc-300">
                    {movie.genre}
                  </span>
                )}
                <span>•</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-zinc-200">
                  1080P HD
                </span>
                {movie.rating && (
                  <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-black border border-amber-500/30">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {movie.rating}
                  </span>
                )}
              </div>
            </div>

            {/* TOP RIGHT: Movie Poster Displayed Prominently as requested */}
            <div className="shrink-0">
              <div className="relative w-24 sm:w-28 lg:w-32 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border-2 border-white/20 bg-zinc-900 group">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-1 inset-x-1 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-300 bg-black/70 px-1.5 py-0.5 rounded">
                    Poster
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body: Stream & Synopsis */}
        <div className="relative z-10 p-5 sm:p-7 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" />
                STREAM & SYNOPSIS
              </h4>
            </div>

            {/* Synopsis Text (Real Myanmar / Custom description from Column I) */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 max-h-60 overflow-y-auto text-zinc-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line select-text font-sans scrollbar-thin">
              {hasBurmeseOrCustomSynopsis ? (
                movie.synopsis
              ) : (
                <div className="space-y-2 text-zinc-400">
                  <p>
                    <strong className="text-white">{movie.title}</strong> is available for high-speed cinema streaming directly via our verified Telegram channel.
                  </p>
                  <p>
                    Click the button below to open Telegram and start streaming.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Key Title Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-black/40 border border-white/5 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Category</span>
              <span className="font-semibold text-zinc-200 capitalize truncate block">
                {movie.category || 'Trending'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Format Type</span>
              <span className="font-semibold text-zinc-200 capitalize truncate block">
                {movie.type || 'Movie'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Subtitle / Audio</span>
              <span className="font-semibold text-zinc-200 truncate block">
                MM Subtitle / HD
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Telegram Link</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1 truncate">
                <ShieldCheck className="w-3 h-3 shrink-0" /> Verified
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <a
              href={movie.tgLink || 'https://t.me/addlist/58gZNGQ86uJiOWE9'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Watch on Telegram</span>
            </a>
            <button
              onClick={onClose}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

