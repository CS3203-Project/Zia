import React from 'react';
import { FiX } from 'react-icons/fi';
import Select from '../../shared/Select';
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
    <div className="pb-8 border-b border-gray-100">

      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
        <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
        Category Selection
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Category */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-900 mb-3">
            Category <span className="text-red-500">*</span>
          </label>
          <Select
            id="categoryId"
            name="categoryId"
            value={categoryId}
            placeholder="Select a category"
            error={!!categoryError}
            options={categories.map((category) => ({ value: category.id, label: category.name || category.slug }))}
            onChange={onInputChange}
          />
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
            <Select
              id="subcategoryId"
              name="subcategoryId"
              value={subcategoryId}
              placeholder={
                !categoryId
                  ? 'Select a category first'
                  : subcategories.length === 0
                    ? 'No subcategories available'
                    : 'Select a subcategory (optional)'
              }
              disabled={!categoryId || subcategories.length === 0}
              options={subcategories.map((subcategory) => ({ value: subcategory.id, label: subcategory.name || subcategory.slug }))}
              onChange={onInputChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
