import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import type { Category } from '../../api/categoryApi';
import { getCategoryIcon, getCategoryGradient } from '../../utils/categoryMapper';

interface CategoryCardProps {
  category: Category;
  viewMode: 'grid' | 'list';
  getTotalServiceCount: (category: Category) => number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, viewMode, getTotalServiceCount }) => {
  const totalServices = getTotalServiceCount(category);
  const Icon = getCategoryIcon(category.slug || '');
  const gradient = getCategoryGradient(category.slug || '');

  return (
    <Link
      to={`/services/${category.slug}`}
      className="group block"
    >
      <div className={`relative rounded-2xl bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)] hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)] transition-shadow duration-200 overflow-hidden ${
        viewMode === 'list' ? 'h-28' : 'h-64'
      }`}>
        <div className={`relative z-10 h-full flex ${viewMode === 'list' ? 'flex-row items-center space-x-4 px-5' : 'flex-col p-6'}`}>
          {/* Icon tile */}
          <div className={`flex-shrink-0 ${viewMode === 'list' ? 'w-12 h-12' : 'w-14 h-14 mb-4'}`}>
            <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Icon className={`${viewMode === 'list' ? 'w-5 h-5' : 'w-7 h-7'} text-white`} />
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 flex flex-col min-w-0 ${viewMode === 'list' ? 'justify-center' : 'justify-between'}`}>
            <div className="flex-grow min-w-0">
              <h3 className={`font-bold text-gray-900 mb-1.5 ${
                viewMode === 'list' ? 'text-base line-clamp-1' : 'text-lg line-clamp-2'
              }`}>
                {category.name}
              </h3>

              {category.description && (
                <p className={`text-gray-500 text-sm leading-relaxed ${
                  viewMode === 'list' ? 'line-clamp-1' : 'line-clamp-3 mb-4'
                }`}>
                  {category.description}
                </p>
              )}
            </div>

            {/* Footer Section - Always at bottom */}
            <div className="mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {totalServices} {totalServices === 1 ? 'service' : 'services'}
                  </span>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all duration-200" />
              </div>

              {/* Subcategories indicator */}
              {category.children && category.children.length > 0 && (
                <div className="mt-1.5 text-xs text-gray-400 font-medium">
                  +{category.children.length} subcategories
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
