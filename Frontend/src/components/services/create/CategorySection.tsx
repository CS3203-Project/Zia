import React from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';
import type { Category } from '../../../api/categoryApi';

interface CategorySectionProps {
  categories: Category[];
  subcategories: Category[];
  categoryId: string;
  subcategoryId: string;
  categoryError?: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  subcategories,
  categoryId,
  subcategoryId,
  categoryError,
  onInputChange,
}) => {
  return (
    <div className="relative bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">

      <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent mb-6 flex items-center">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
        Category Selection
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Category */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-900 mb-3">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="categoryId"
              name="categoryId"
              value={categoryId}
              onChange={onInputChange}
              className={`w-full px-4 py-4 bg-gray-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 appearance-none text-gray-900 ${
                categoryError ? 'border-red-300 ring-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name || category.slug}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <FiChevronDown className="text-gray-500 w-5 h-5" />
            </div>
          </div>
          {categoryError && <p className="mt-2 text-sm text-red-500 flex items-center">
            <FiX className="w-4 h-4 mr-1" />
            {categoryError}
          </p>}
        </div>

        {/* Subcategory */}
        {subcategories.length > 0 && (
          <div>
            <label htmlFor="subcategoryId" className="block text-sm font-semibold text-gray-900 mb-3">
              Subcategory
            </label>
            <div className="relative">
              <select
                id="subcategoryId"
                name="subcategoryId"
                value={subcategoryId}
                onChange={onInputChange}
                disabled={!categoryId || subcategories.length === 0}
                className={`w-full px-4 py-4 bg-gray-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 appearance-none text-gray-900 ${
                  !categoryId || subcategories.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <option value="">
                  {!categoryId
                    ? 'Select a category first'
                    : subcategories.length === 0
                      ? 'No subcategories available'
                      : 'Select a subcategory (optional)'
                  }
                </option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name || subcategory.slug}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <FiChevronDown className={!categoryId || subcategories.length === 0 ? 'text-gray-300 w-5 h-5' : 'text-gray-500 w-5 h-5'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
