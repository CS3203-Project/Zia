import React from 'react';

interface EmptyServicesStateProps {
  selectedSubCategory: string | null;
  categoryName?: string;
  hasSubcategories: boolean;
}

/**
 * "No services found" state shown below the results header when the
 * current category/subcategory filter has no active services.
 */
const EmptyServicesState: React.FC<EmptyServicesStateProps> = ({ selectedSubCategory, categoryName, hasSubcategories }) => {
  return (
    <div className="text-center py-20">
      <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 max-w-lg mx-auto">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">No Services Found</h3>
        <p className="text-gray-500 leading-relaxed mb-6">
          {selectedSubCategory
            ? `There are currently no active services available in this subcategory.`
            : `There are currently no active services available in "${categoryName}" or its subcategories.`
          }
        </p>
        {!selectedSubCategory && hasSubcategories && (
          <p className="text-gray-400 text-sm">
            Try selecting a specific subcategory from the sidebar.
          </p>
        )}
      </div>
    </div>
  );
};

export default EmptyServicesState;
