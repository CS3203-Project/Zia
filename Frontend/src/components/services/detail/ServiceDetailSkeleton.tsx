import React from 'react';
import Skeleton from '@/components/shared/Skeleton';

/**
 * Loading placeholder shown while a service's details are being fetched.
 * Purely presentational - mirrors the layout of the loaded ServiceDetailPage.
 */
const ServiceDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col relative overflow-hidden">
      <main className="flex-1 mt-16 relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Skeleton Breadcrumb */}
          <div className="mb-8 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <Skeleton className="h-4 w-1/3" />
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-2 space-y-4">
              {/* Media Gallery Skeleton */}
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                <Skeleton className="aspect-[16/9] rounded-none" />
                <div className="p-4 flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="w-14 h-14 rounded-xl" />
                  ))}
                </div>
              </div>

              {/* Service Info Skeleton */}
              <div className="py-8 px-6 space-y-4">
                <Skeleton className="h-10 w-2/3" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 rounded-full w-20" />
                  ))}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
                <Skeleton className="h-6 w-1/4 mt-4" />

                {/* Location Card Skeleton */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-6">
                  <Skeleton className="h-6 w-1/3 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-24">
                {/* Avatar Skeleton */}
                <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-100">
                  <Skeleton className="w-20 h-20 rounded-full mb-4" />
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />

                  {/* Contact Info Skeleton */}
                  <div className="mt-4 w-full space-y-2">
                    <Skeleton className="h-10 rounded-xl" />
                    <Skeleton className="h-10 rounded-xl" />
                  </div>

                  <div className="flex gap-4 mt-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>

                {/* Price Skeleton */}
                <div className="text-center mb-6 space-y-3">
                  <Skeleton className="h-10 w-32 mx-auto" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                  <Skeleton className="h-8 rounded-full w-32 mx-auto" />
                </div>

                {/* Buttons Skeleton */}
                <div className="space-y-3 mb-6">
                  <Skeleton className="h-14 rounded-full" />
                  <Skeleton className="h-14 rounded-full" />
                </div>

                {/* Working Hours Skeleton */}
                <div className="pt-6 border-t border-gray-100 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Skeleton */}
          <div className="mb-6 mt-6">
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 rounded-full w-32" />
            </div>

            <div className="flex gap-6 overflow-hidden pb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-[90%] sm:w-[45%] lg:w-[32%]">
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-start gap-4 mb-6">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <Skeleton key={j} className="w-5 h-5" />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceDetailSkeleton;
