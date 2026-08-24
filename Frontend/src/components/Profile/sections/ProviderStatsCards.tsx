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
      <div className="group backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-3">
          <div className="w-14 h-14 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
            <Star className="h-7 w-7 text-gray-900" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">
              {providerProfile.averageRating?.toFixed(1) || 'N/A'}
            </p>
            <p className="text-sm text-gray-500 font-semibold">Average Rating</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < Math.floor(providerProfile.averageRating || 0)
                  ? 'text-gray-900 fill-current'
                  : 'text-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="group backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-3">
          <div className="w-14 h-14 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
            <Award className="h-7 w-7 text-gray-900" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">
              {providerProfile.totalReviews || 0}
            </p>
            <p className="text-sm text-gray-500 font-semibold">Total Reviews</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 font-semibold">
          {providerProfile.totalReviews && providerProfile.totalReviews > 0
            ? `✨ ${((providerProfile.averageRating || 0) / 5 * 100).toFixed(0)}% satisfaction`
            : 'No reviews yet'
          }
        </p>
      </div>

      <div className="group backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-3">
          <div className="w-14 h-14 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
            <Briefcase className="h-7 w-7 text-gray-900" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">
              {services.length}
            </p>
            <p className="text-sm text-gray-500 font-semibold">Services Listed</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 font-semibold">
          ✓ {services.filter(s => s.isActive).length} active • {services.filter(s => !s.isActive).length} inactive
        </p>
      </div>
    </div>
  );
}
