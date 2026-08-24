import React from 'react';

interface ConversationListSkeletonProps {
  count?: number;
}

/**
 * Skeleton rows shown while the conversation list is loading for the first
 * time.
 */
const ConversationListSkeleton: React.FC<ConversationListSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: count }, (_, index) => index + 1).map((index) => (
        <div key={index} className="p-6 animate-pulse">
          <div className="flex items-center space-x-4">
            {/* Avatar Skeleton */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-orange-50 rounded-full"></div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Name Skeleton */}
              <div className="h-5 bg-orange-50 rounded-lg w-1/3"></div>

              {/* Message Skeleton */}
              <div className="space-y-2">
                <div className="h-3 bg-gray-50 rounded-lg w-full"></div>
                <div className="h-3 bg-gray-50 rounded-lg w-2/3"></div>
              </div>
            </div>

            {/* Time Skeleton */}
            <div className="flex-shrink-0">
              <div className="h-3 bg-orange-50 rounded-lg w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationListSkeleton;
