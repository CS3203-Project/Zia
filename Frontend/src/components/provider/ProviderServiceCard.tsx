import { Briefcase, Clock } from 'lucide-react';
import type { ServiceResponse } from '../../api/serviceApi';

interface ProviderServiceCardProps {
  service: ServiceResponse;
  onClick: () => void;
}

export default function ProviderServiceCard({ service, onClick }: ProviderServiceCardProps) {
  return (
    <div
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative">
        {service.images && service.images.length > 0 ? (
          <img
            src={service.images[0]}
            alt={service.title || 'Service image'}
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = `https://picsum.photos/seed/${service.id}/400/300`;
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">No image available</p>
            </div>
          </div>
        )}
        <span className="absolute top-4 left-4 px-3 py-1 bg-white text-gray-700 border border-gray-200 text-xs font-semibold rounded-full shadow-sm">
          {service.category?.name || 'Category'}
        </span>
        <span className={`absolute top-4 right-4 px-2 py-1 text-xs rounded-full font-medium ${
          service.isActive
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {service.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {service.title || 'Untitled Service'}
          </h3>
          <span className="text-xl font-bold text-gray-900">
            {service.currency} {service.price}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {service.description || 'No description available'}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Contact for timing</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {service.tags && service.tags.length > 0 ?
              service.tags.slice(0, 2).map((tag: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {tag}
                </span>
              )) :
              <span className="text-xs text-gray-400">No tags</span>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
