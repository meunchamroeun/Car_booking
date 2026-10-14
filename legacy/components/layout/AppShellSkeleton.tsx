import React from 'react';

export function AppShellSkeleton() {
  return (
    <div
      className="min-h-screen bg-slate-100/60 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased flex justify-center transition-colors"
      suppressHydrationWarning
    >
      <div
        id="app"
        className="w-full max-w-[430px] min-h-screen bg-white dark:bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.06)] dark:shadow-[0_0_60px_rgba(0,0,0,0.6)] border-x border-slate-200/60 dark:border-zinc-800/80 flex flex-col relative overflow-x-hidden animate-pulse"
        suppressHydrationWarning
      >
        {/* Skeleton Header matching hero-container gradient */}
        <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 px-4 pt-5 pb-5 rounded-b-[28px] text-white">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 bg-white/30 rounded" />
                <div className="h-2.5 w-32 bg-white/20 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20" />
              <div className="w-8 h-8 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="h-7 w-28 bg-white/20 rounded-full" />
            <div className="h-7 w-24 bg-white/20 rounded-full" />
          </div>
        </div>

        {/* Skeleton Body Cards */}
        <div className="flex-1 p-3.5 space-y-3.5">
          {/* Active Mission Banner Skeleton */}
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800" />

          {/* Filter Card Skeleton */}
          <div className="h-28 rounded-2xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800" />

          {/* Vehicle Card Skeletons */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800"
            />
          ))}
        </div>

        {/* Floating Dock Skeleton */}
        <div className="fixed bottom-3 inset-x-0 mx-auto max-w-[430px] px-3 z-40 pointer-events-none">
          <div className="h-14 rounded-full bg-white/90 dark:bg-zinc-900/90 shadow-xl border border-slate-200/80 dark:border-zinc-800" />
        </div>
      </div>
    </div>
  );
}
