import { Star, Award, Briefcase } from 'lucide-react';
import type { ProviderProfile } from '../../../api/userApi';
import type { ServiceResponse } from '../../../api/serviceApi';

interface ProviderStatsCardsProps {
  providerProfile: ProviderProfile;
  services: ServiceResponse[];
}

export default function ProviderStatsCards({ providerProfile, services }: ProviderStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
            <Star className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {providerProfile.averageRating?.toFixed(1) || 'N/A'}
            </p>
            <p className="text-sm text-gray-500 font-medium">Average Rating</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(providerProfile.averageRating || 0)
                  ? 'text-orange-500 fill-current'
                  : 'text-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
            <Award className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {providerProfile.totalReviews || 0}
            </p>
            <p className="text-sm text-gray-500 font-medium">Total Reviews</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 font-medium">
          {providerProfile.totalReviews && providerProfile.totalReviews > 0
            ? `${((providerProfile.averageRating || 0) / 5 * 100).toFixed(0)}% satisfaction`
            : 'No reviews yet'
          }
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {services.length}
            </p>
            <p className="text-sm text-gray-500 font-medium">Services Listed</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 font-medium">
          {services.filter(s => s.isActive).length} active • {services.filter(s => !s.isActive).length} inactive
        </p>
      </div>
    </div>
  );
}
