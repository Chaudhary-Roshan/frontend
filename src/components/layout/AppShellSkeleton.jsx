import React from 'react';

/**
 * Standard Page Skeleton Loader
 */
export const PageSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-8">
    {/* Hero / Header Skeleton */}
    <div className="bg-slate-200/80 rounded-3xl p-8 h-48 flex flex-col justify-end gap-3">
      <div className="h-4 bg-slate-300 rounded-md w-32" />
      <div className="h-8 bg-slate-300 rounded-xl w-72" />
      <div className="h-4 bg-slate-300 rounded-md w-96 max-w-full" />
    </div>

    {/* Metric / Category Bar Skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-200/70 h-24 rounded-2xl p-4 flex flex-col justify-between">
          <div className="h-3 bg-slate-300 rounded w-16" />
          <div className="h-6 bg-slate-300 rounded-lg w-24" />
        </div>
      ))}
    </div>

    {/* Grid of Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
          <div className="h-40 bg-slate-200 rounded-xl w-full" />
          <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-5/6" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-4 bg-slate-200 rounded w-20" />
            <div className="h-8 bg-slate-200 rounded-xl w-24" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Dashboard Portal Skeleton Loader
 */
export const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
    {/* Executive Top Banner */}
    <div className="bg-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-16 h-16 rounded-2xl bg-slate-300 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-slate-300 rounded-lg w-48" />
          <div className="h-4 bg-slate-300 rounded-md w-36" />
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <div className="h-10 bg-slate-300 rounded-xl w-28" />
        <div className="h-10 bg-slate-300 rounded-xl w-28" />
      </div>
    </div>

    {/* 4 Stat Cards */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-slate-200 rounded w-20" />
            <div className="w-8 h-8 rounded-lg bg-slate-200" />
          </div>
          <div className="h-7 bg-slate-300 rounded-lg w-16" />
        </div>
      ))}
    </div>

    {/* Split Panels */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm h-96">
        <div className="h-5 bg-slate-200 rounded-lg w-48" />
        <div className="h-64 bg-slate-100 rounded-xl w-full" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm h-96">
        <div className="h-5 bg-slate-200 rounded-lg w-36" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                <div className="h-2.5 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default PageSkeleton;
