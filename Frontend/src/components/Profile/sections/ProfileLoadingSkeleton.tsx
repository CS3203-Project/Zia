export default function ProfileLoadingSkeleton() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-orange-50 to-white overflow-hidden">
      {/* Background accent - matches homepage */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 opacity-10 blur-3xl">
          <div className="w-full h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Content Overlay - Glass Morphism */}
      <div className="relative z-10 flex flex-col min-h-screen" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
        <main className="flex-1 mx-[30px] px-4 sm:px-6 lg:px-8 mt-20 mb-8">
          {/* Profile Header Skeleton */}
          <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] overflow-hidden mb-8">
            {/* Banner Skeleton */}
            <div className="relative h-36 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-black/2 to-black/5"></div>

              {/* Avatar Skeleton */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-16 z-10">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] bg-gray-300 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Header Content Skeleton */}
            <div className="px-4 sm:px-6 pb-6 bg-gradient-to-b from-white/10 to-transparent">
              <div className="flex flex-col lg:flex-row items-center lg:items-end lg:space-x-8 mt-0">
                <div className="w-32 h-16 lg:hidden"></div>
                <div className="flex-1 text-center lg:text-left ml-5 mt-13 lg:mt-0">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-300 rounded w-48 mb-2 mx-auto lg:mx-0"></div>
                      <div className="h-4 bg-gray-300 rounded w-32 mb-2 mx-auto lg:mx-0"></div>
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2">
                        <div className="h-6 bg-gray-300 rounded-full w-24"></div>
                        <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                        <div className="h-6 bg-gray-300 rounded-full w-20"></div>
                      </div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-10 bg-gray-300 rounded-full w-32"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 rounded-xl bg-white/50">
                        <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-300 rounded w-16 mb-1"></div>
                          <div className="h-4 bg-gray-300 rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Services Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                            <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                            <div className="flex items-center gap-2">
                              <div className="h-5 bg-gray-300 rounded w-12"></div>
                              <div className="h-5 bg-gray-300 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                        </div>
                        <div className="h-8 bg-gray-300 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
