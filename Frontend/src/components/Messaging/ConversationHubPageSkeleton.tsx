import React from 'react';

/**
 * Full-page skeleton shown while the current user's profile is still being
 * fetched, before the conversation list itself can be requested.
 */
const ConversationHubPageSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 animate-pulse"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-orange-50 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-gray-50 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>

      <main className="flex-grow container mx-auto px-4 py-8 mt-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8 text-center animate-pulse">
            <div className="h-12 bg-orange-50 rounded-lg w-96 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-50 rounded-lg w-2/3 mx-auto"></div>
          </div>

          {/* Button Skeleton */}
          <div className="mb-8 flex justify-center animate-pulse">
            <div className="h-14 bg-orange-50 rounded-2xl w-72"></div>
          </div>

          {/* Conversations List Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="relative z-10 divide-y divide-gray-100">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    {/* Avatar Skeleton */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-orange-100 rounded-full"></div>
                    </div>

                    {/* Content Skeleton */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Name Skeleton */}
                      <div className="h-6 bg-orange-100 rounded-lg w-1/3"></div>

                      {/* Message Skeleton */}
                      <div className="space-y-2">
                        <div className="h-4 bg-orange-50 rounded-lg w-full"></div>
                        <div className="h-4 bg-orange-50 rounded-lg w-3/4"></div>
                      </div>
                    </div>

                    {/* Right side Skeleton */}
                    <div className="flex flex-col items-end space-y-2">
                      <div className="h-3 bg-orange-50 rounded-lg w-16"></div>
                      <div className="w-7 h-7 bg-orange-100 rounded-full"></div>
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

export default ConversationHubPageSkeleton;
