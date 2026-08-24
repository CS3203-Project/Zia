import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

interface CategoryResultsHeaderProps {
  currentCategoryName?: string;
  showSubcategoriesHint: boolean;
  isLoading: boolean;
  selectedSubCategory: string | null;
  resultCount: number;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}

/**
 * Header above the services grid: current subcategory name, a loading /
 * result-count indicator, and the sort dropdown.
 */
const CategoryResultsHeader: React.FC<CategoryResultsHeaderProps> = ({
  currentCategoryName,
  showSubcategoriesHint,
  isLoading,
  selectedSubCategory,
  resultCount,
  sortBy,
  onSortChange
}) => {
  return (
    <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {currentCategoryName}
          </h2>
          {showSubcategoriesHint && (
            <span className="text-xs text-gray-500">
              Including all subcategories
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              <span className="text-xs text-gray-500">
                {selectedSubCategory ? 'Loading services...' : 'Loading all services...'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-500 font-medium">{resultCount} services</span>
          )}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              title="Sort services"
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-3 pr-9 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:bg-gray-100 transition-all duration-300"
            >
              <option value="relevance" className="bg-white text-gray-900">Sort by: Relevance</option>
              <option value="price-low" className="bg-white text-gray-900">Sort by: Price (Low to High)</option>
              <option value="price-high" className="bg-white text-gray-900">Sort by: Price (High to Low)</option>
              <option value="newest" className="bg-white text-gray-900">Sort by: Newest First</option>
              <option value="oldest" className="bg-white text-gray-900">Sort by: Oldest First</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryResultsHeader;
