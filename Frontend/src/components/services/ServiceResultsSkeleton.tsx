import React from 'react';

interface ServiceResultsSkeletonProps {
  count?: number;
}

/**
 * Grid of skeleton service cards shown while the filtered/sorted results are
 * being recomputed (e.g. after picking a subcategory).
 */
const ServiceResultsSkeleton: React.FC<ServiceResultsSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceResultsSkeleton;
