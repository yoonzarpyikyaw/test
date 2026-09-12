import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[#070709] text-white pt-20 pb-20 animate-pulse">
      {/* Hero Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="w-full h-[55vh] rounded-3xl bg-zinc-900/60 border border-white/5 flex flex-col justify-end p-8 sm:p-12 space-y-4">
          <div className="w-32 h-6 rounded-full bg-zinc-800/80" />
          <div className="w-3/4 sm:w-1/2 h-12 rounded-2xl bg-zinc-800/80" />
          <div className="w-1/3 h-4 rounded bg-zinc-800/60" />
          <div className="w-full max-w-lg h-16 rounded-xl bg-zinc-800/40" />
          <div className="flex gap-4 pt-2">
            <div className="w-36 h-12 rounded-2xl bg-red-900/40" />
            <div className="w-32 h-12 rounded-2xl bg-zinc-800/50" />
          </div>
        </div>
      </div>

      {/* Trending Row Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-48 h-8 rounded-xl bg-zinc-800/80" />
          <div className="w-24 h-8 rounded-xl bg-zinc-800/50" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-48 shrink-0 space-y-2">
              <div className="w-full aspect-[2/3] rounded-2xl bg-zinc-800/60" />
              <div className="w-3/4 h-4 rounded bg-zinc-800/50" />
              <div className="w-1/2 h-3 rounded bg-zinc-800/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Discover Catalog Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="w-64 h-8 rounded-xl bg-zinc-800/80" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="space-y-2">
              <div className="w-full aspect-[2/3] rounded-2xl bg-zinc-800/50" />
              <div className="w-3/4 h-3.5 rounded bg-zinc-800/40" />
              <div className="w-1/2 h-3 rounded bg-zinc-800/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
