import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ImageOff } from 'lucide-react';
import type { HybridSearchResult } from '../../api/hybridSearchApi';

// Service card used to preview hybrid/keyword search results on BrowseServices.
// Not to be confused with components/services/ServiceCard.tsx, which renders
// PlaceCard-based service listings from ServiceResponse/Service data.
interface SearchResultServiceCardProps {
  service: HybridSearchResult;
  viewMode: 'grid' | 'list';
  showDistance: boolean;
}

const SearchResultServiceCard: React.FC<SearchResultServiceCardProps> = ({ service, viewMode, showDistance }) => {
  const price = typeof service.price === 'string' ? parseFloat(service.price) : service.price;

  return (
    <Link
      to={`/service/${service.id}`}
      className={`group block bg-white rounded-2xl shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)] border border-gray-100 hover:border-orange-200 hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${
        viewMode === 'list' ? 'p-4' : 'p-6'
      }`}
    >
      <div className={`${viewMode === 'list' ? 'flex items-start space-x-4' : ''}`}>
        {/* Service Image */}
        <div className={`flex-shrink-0 ${viewMode === 'list' ? 'w-24 h-24' : 'w-full h-48 mb-4'}`}>
          <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-100 rounded-xl overflow-hidden ${
            viewMode === 'list' ? '' : ''
          }`}>
            {service.images && service.images.length > 0 ? (
              <img
                src={service.images[0]}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center ${service.images && service.images.length > 0 ? 'hidden' : ''}`}>
              <ImageOff className="w-8 h-8 text-gray-300" />
            </div>
          </div>
        </div>

        {/* Service Content */}
        <div className={`flex-1 ${viewMode === 'list' ? '' : ''}`}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
              {service.title}
            </h3>
            {service.similarity && (
              <div className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                {Math.round(service.similarity * 100)}% match
              </div>
            )}
          </div>

          <p className="text-gray-500 text-sm mb-3 line-clamp-3">
            {service.description}
          </p>

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {service.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-100"
                >
                  {tag}
                </span>
              ))}
              {service.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-100">
                  +{service.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Provider and Category */}
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <span>
              by {service.provider.user.firstName} {service.provider.user.lastName}
            </span>
            <span className="mx-2">•</span>
            <span>{service.category.name}</span>
          </div>

          {/* Distance and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {showDistance && service.distance_km !== undefined && service.distance_km !== null && (
                <div className="flex items-center text-sm text-gray-900">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{service.distance_km.toFixed(1)} km away</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {service.currency} {price?.toLocaleString()}
              </div>
              {service.address && (
                <div className="text-xs text-gray-500 line-clamp-1">
                  {service.address}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SearchResultServiceCard;
