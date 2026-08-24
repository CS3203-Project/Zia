import React from 'react';

// Placeholder tile shown while a hybrid/keyword search is in flight, in the
// same shape as SearchResultServiceCard.
const SearchResultCardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)] p-6">
      <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

export default SearchResultCardSkeleton;
