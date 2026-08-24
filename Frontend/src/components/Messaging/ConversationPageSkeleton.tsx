import React from 'react';

/**
 * Full-page skeleton shown while the current user's profile is still being
 * fetched, before we even know which conversation to load.
 */
const ConversationPageSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <main className="flex-grow px-4 py-6 mt-16">
        <div className="h-[calc(100vh-8rem)] flex flex-col">
          {/* Header Skeleton */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-32 h-10 bg-orange-50 rounded-xl animate-pulse"></div>
              <div className="w-48 h-10 bg-gray-50 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="bg-white rounded-2xl shadow-2xl flex-1 flex flex-col md:flex-row overflow-hidden border border-gray-200 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 animate-pulse rounded-2xl"></div>

            <div className="flex-1 flex flex-col relative z-10">
              <div className="flex flex-col h-full">
                {/* Left Side Skeleton - Confirmation Panel */}
                <div className="w-full md:w-80 xl:w-96 flex-shrink-0 flex flex-col bg-gray-50 backdrop-blur-sm border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 space-y-4 overflow-y-auto h-full md:max-h-none">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-50 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-50 rounded-lg animate-pulse"></div>
                      <div className="h-3 bg-gray-50 rounded-lg animate-pulse w-3/4"></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-4 bg-gray-50 rounded-lg animate-pulse"></div>
                    <div className="h-4 bg-gray-50 rounded-lg animate-pulse w-5/6"></div>
                    <div className="h-4 bg-gray-50 rounded-lg animate-pulse w-4/6"></div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="h-10 bg-gray-50 rounded-xl animate-pulse"></div>
                    <div className="h-10 bg-gray-50 rounded-xl animate-pulse"></div>
                  </div>
                </div>

                {/* Right Side Skeleton - Message Thread */}
                <div className="flex-1 min-w-0 flex flex-col p-4 md:p-6 space-y-4">
                  <div className="flex space-x-3">
                    <div className="flex-1 h-12 bg-gray-50 rounded-xl animate-pulse"></div>
                    <div className="w-12 h-12 bg-orange-50 rounded-xl animate-pulse"></div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-hidden">
                    <div className="flex justify-start">
                      <div className="max-w-xs lg:max-w-md px-4 py-3 bg-gray-50 rounded-2xl animate-pulse">
                        <div className="space-y-2">
                          <div className="h-4 bg-orange-50 rounded-lg"></div>
                          <div className="h-4 bg-orange-50 rounded-lg w-3/4"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="max-w-xs lg:max-w-md px-4 py-3 bg-orange-50 rounded-2xl animate-pulse">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-50 rounded-lg"></div>
                          <div className="h-4 bg-gray-50 rounded-lg w-5/6"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="max-w-xs lg:max-w-md px-4 py-3 bg-gray-50 rounded-2xl animate-pulse">
                        <div className="space-y-2">
                          <div className="h-4 bg-orange-50 rounded-lg"></div>
                          <div className="h-4 bg-orange-50 rounded-lg w-4/6"></div>
                          <div className="h-4 bg-orange-50 rounded-lg w-2/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConversationPageSkeleton;
