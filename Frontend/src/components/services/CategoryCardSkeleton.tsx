import React from 'react';

interface CategoryCardSkeletonProps {
  viewMode: 'grid' | 'list';
}

// Placeholder tile shown in the categories grid while searching/refreshing,
// in the same shape as CategoryCard.
const CategoryCardSkeleton: React.FC<CategoryCardSkeletonProps> = ({ viewMode }) => (
  <div className="animate-pulse">
    <div className={`bg-white border border-gray-100 rounded-2xl shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)] ${viewMode === 'grid' ? 'p-6' : 'p-4'}`}>
      <div className={`flex items-start ${viewMode === 'list' ? 'space-x-4' : ''}`}>
        <div className={`flex-shrink-0 ${viewMode === 'list' ? 'w-16 h-16' : 'w-14 h-14'} bg-gray-200 rounded-xl`}></div>
        <div className={`flex-1 ${viewMode === 'list' ? '' : 'ml-4'}`}>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
          {viewMode === 'grid' && (
            <>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default CategoryCardSkeleton;
