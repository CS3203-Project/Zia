import React from 'react';
import { Loader2 } from 'lucide-react';
import type { ServiceResponse } from '../../api/serviceApi';
import type { Category } from '../../api/categoryApi';

interface SubCategorySidebarProps {
  category: Category;
  selectedSubCategory: string | null;
  onSelectSubCategory: (categoryId: string | null) => void;
  allServices: ServiceResponse[];
  isLoading?: boolean;
}

/**
 * Sidebar listing a category's subcategories with live service counts,
 * plus an "All <category>" option to clear the subcategory filter.
 */
const SubCategorySidebar: React.FC<SubCategorySidebarProps> = ({
  category,
  selectedSubCategory,
  onSelectSubCategory,
  allServices,
  isLoading
}) => {

  // Calculate service counts for each subcategory using allServices to maintain accurate counts
  const getSubcategoryServiceCount = (subcategoryId: string) => {
    return allServices.filter(service => service.category?.id === subcategoryId).length;
  };

  const getAllCategoryServiceCount = () => {
    return allServices.length;
  };

  return (
    <div className="w-full md:w-1/4 lg:w-1/5 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3 text-gray-500">Subcategories</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onSelectSubCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                selectedSubCategory === null
                  ? 'bg-orange-500 text-white font-semibold'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>All {category.name}</span>
                {isLoading && allServices.length === 0 ? (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedSubCategory === null
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Loader2 className="w-3 h-3 animate-spin inline" />
                  </span>
                ) : (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedSubCategory === null
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getAllCategoryServiceCount()}
                  </span>
                )}
              </div>
            </button>
          </li>
          {category.children && category.children.map((sub) => {
            const serviceCount = getSubcategoryServiceCount(sub.id);
            return (
              <li key={sub.id}>
                <button
                  onClick={() => onSelectSubCategory(sub.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    selectedSubCategory === sub.id
                      ? 'bg-orange-500 text-white font-semibold'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{sub.name}</span>
                    {isLoading && allServices.length === 0 ? (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedSubCategory === sub.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedSubCategory === sub.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {serviceCount}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default SubCategorySidebar;
