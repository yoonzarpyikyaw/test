import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase, MovieRecord } from '../../../lib/supabase';
import { ArrowLeft, Play, Send, Star, Clock, Calendar, Shield, Share2 } from 'lucide-react';

interface Props {
  params: { id: string };
}

export const revalidate = 120;

// Google Search SEO metadata generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!movie) {
    return { title: 'Movie Not Found - Family Version' };
  }

  const title = `${movie.title} (${movie.year}) - Watch on Telegram | Family Version`;
  const description = movie.synopsis || movie.overview || `Watch ${movie.title} (${movie.year}) on Telegram with Myanmar Subtitles and HD Quality.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: movie.backdrop_url ? [movie.backdrop_url] : (movie.poster_url ? [movie.poster_url] : []),
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: movie.backdrop_url ? [movie.backdrop_url] : [],
    },
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!movie) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      {/* Background Backdrop with Gradient Overlays */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="w-full h-[70vh] bg-cover bg-center opacity-20 filter blur-sm"
          style={{ backgroundImage: `url(${movie.backdrop_url || movie.poster_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900/80 px-4 py-2.5 rounded-xl border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Catalog</span>
          </Link>

          <a
            href="https://t.me/addlist/58gZNGQ86uJiOWE9"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-red-400 hover:text-red-300"
          >
            Join Family Version Channel
          </a>
        </div>

        {/* Movie Detail Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Poster Column */}
          <div className="md:col-span-4 flex justify-center">
            <div className="relative w-64 md:w-full aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl shadow-red-950/20 border border-white/10 bg-zinc-900">
              {movie.poster_url && (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              )}
              {movie.quality && (
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-red-600 text-white font-bold text-xs shadow-md">
                  {movie.quality}
                </span>
              )}
            </div>
          </div>

          {/* Metadata Column */}
          <div className="md:col-span-8 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="text-sm text-zinc-400 italic">Original: {movie.original_title}</p>
              )}
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-xl bg-white/10 text-white flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {movie.year}
              </span>
              {movie.rating && (
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{Number(movie.rating).toFixed(1)} / 10</span>
                </span>
              )}
              {movie.duration && (
                <span className="px-3 py-1 rounded-xl bg-white/10 text-zinc-300 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{movie.duration}m</span>
                </span>
              )}
              {movie.age_rating && (
                <span className="px-3 py-1 rounded-xl bg-white/10 text-zinc-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{movie.age_rating}</span>
                </span>
              )}
              {movie.language && (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {movie.language}
                </span>
              )}
            </div>

            {/* Genres */}
            {movie.genres && (
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(movie.genres) ? movie.genres : String(movie.genres).split(',')).map((g: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-zinc-900 border border-white/5 text-xs text-zinc-300 font-medium"
                  >
                    {g.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Synopsis</h2>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                {movie.synopsis || movie.overview || 'No synopsis available for this title.'}
              </p>
            </div>

            {/* PRIMARY CTA: Watch on Telegram */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {movie.tg_link ? (
                <a
                  href={movie.tg_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm transition-all shadow-xl shadow-red-600/30 hover:scale-[1.02]"
                >
                  <Send className="w-5 h-5" />
                  <span>Watch on Telegram</span>
                </a>
              ) : (
                <div className="px-6 py-3 rounded-2xl bg-zinc-900 text-zinc-500 text-xs font-semibold">
                  Telegram link coming soon
                </div>
              )}

              <a
                href="https://t.me/addlist/58gZNGQ86uJiOWE9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-sm font-bold transition-all"
              >
                <span>Join Official Channel</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
