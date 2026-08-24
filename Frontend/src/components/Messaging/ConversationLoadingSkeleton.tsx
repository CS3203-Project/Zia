import React from 'react';
import MobileViewToggle from './MobileViewToggle';

interface ConversationLoadingSkeletonProps {
  isChatVisibleOnMobile: boolean;
  onToggleMobileView: (isChatVisibleOnMobile: boolean) => void;
}

/**
 * Skeleton shown inside the main content panel while the active conversation
 * (confirmation panel + message thread) is being resolved.
 */
const ConversationLoadingSkeleton: React.FC<ConversationLoadingSkeletonProps> = ({
  isChatVisibleOnMobile,
  onToggleMobileView
}) => {
  return (
    <div className="flex-1 flex flex-col relative z-10">
      {/* Mobile Toggle Buttons - Only visible on small screens during loading */}
      <MobileViewToggle isChatVisibleOnMobile={isChatVisibleOnMobile} onToggle={onToggleMobileView} variant="loading" />

      {/* Mobile responsive skeleton loading */}
      <div className="flex flex-col h-full">
        {/* Left Side Skeleton - Confirmation Panel */}
        <div className={`w-full md:w-80 xl:w-96 flex-shrink-0 flex flex-col bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-4 md:p-6 space-y-4 overflow-y-auto h-full md:max-h-none ${
          isChatVisibleOnMobile ? 'hidden md:flex' : 'flex'
        }`}>
          {/* User info skeleton */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-50 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-50 rounded-lg animate-pulse"></div>
              <div className="h-3 bg-gray-50 rounded-lg animate-pulse w-3/4"></div>
            </div>
          </div>

          {/* Service info skeleton */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-50 rounded-lg animate-pulse"></div>
            <div className="h-4 bg-gray-50 rounded-lg animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-50 rounded-lg animate-pulse w-4/6"></div>
          </div>

          {/* Confirmation buttons skeleton */}
          <div className="space-y-3 mt-6">
            <div className="h-10 bg-gray-50 rounded-xl animate-pulse"></div>
            <div className="h-10 bg-gray-50 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Right Side Skeleton - Message Thread */}
        <div className={`flex-1 min-w-0 flex flex-col p-4 md:p-6 space-y-4 ${
          !isChatVisibleOnMobile ? 'hidden md:flex' : 'flex'
        }`}>
          {/* User info skeleton */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-50 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-50 rounded-lg animate-pulse"></div>
              <div className="h-3 bg-gray-50 rounded-lg animate-pulse w-3/4"></div>
            </div>
          </div>

          {/* Service info skeleton */}
          <div className="space-y-3">
            <div className="h-4 bg-gray-50 rounded-lg animate-pulse"></div>
            <div className="h-4 bg-gray-50 rounded-lg animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-50 rounded-lg animate-pulse w-4/6"></div>
          </div>

          {/* Confirmation buttons skeleton */}
          <div className="space-y-3 mt-6">
            <div className="h-10 bg-gray-50 rounded-xl animate-pulse"></div>
            <div className="h-10 bg-gray-50 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Right Side Skeleton - Message Thread */}
        <div className="flex-1 min-w-0 flex flex-col p-4 md:p-6 space-y-4">
          {/* Message input skeleton */}
          <div className="flex space-x-3">
            <div className="flex-1 h-12 bg-gray-50 rounded-xl animate-pulse"></div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl animate-pulse"></div>
          </div>

          {/* Messages skeleton */}
          <div className="flex-1 space-y-4 overflow-hidden">
            {/* Incoming message */}
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-3 bg-gray-50 rounded-2xl animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-orange-50 rounded-lg"></div>
                  <div className="h-4 bg-orange-50 rounded-lg w-3/4"></div>
                </div>
              </div>
            </div>

            {/* Outgoing message */}
            <div className="flex justify-end">
              <div className="max-w-xs lg:max-w-md px-4 py-3 bg-orange-50 rounded-2xl animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-50 rounded-lg"></div>
                  <div className="h-4 bg-gray-50 rounded-lg w-5/6"></div>
                </div>
              </div>
            </div>

            {/* Another incoming message */}
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-3 bg-gray-50 rounded-2xl animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-orange-50 rounded-lg"></div>
                  <div className="h-4 bg-orange-50 rounded-lg w-4/6"></div>
                  <div className="h-4 bg-orange-50 rounded-lg w-2/6"></div>
                </div>
              </div>
            </div>

            {/* Typing indicator skeleton */}
            <div className="flex justify-start">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-100 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-100 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-orange-100 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationLoadingSkeleton;
