import React from 'react';
import Skeleton from '../shared/Skeleton';

// Full-page skeleton shown while BrowseServices is fetching the initial
// category list.
const BrowseServicesLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white">
    <main className="container mx-auto px-4 pt-20 pb-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="text-center mb-10">
        <Skeleton className="h-10 w-72 mx-auto mb-3" />
        <Skeleton className="h-5 w-96 max-w-full mx-auto" />
      </div>

      {/* Search Section Skeleton */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)] rounded-2xl p-6">
          <Skeleton className="h-14 w-full rounded-xl mb-4" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Controls Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>

      {/* Categories Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)] p-6">
            <Skeleton className="w-14 h-14 rounded-2xl mb-4" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3.5 w-full mb-1.5" />
            <Skeleton className="h-3.5 w-2/3 mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

export default BrowseServicesLoadingSkeleton;
