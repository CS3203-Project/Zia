import { Star, Award, Briefcase } from 'lucide-react';

interface ProviderStatsGridProps {
  averageRating: number | null | undefined;
  totalReviews: number | null | undefined;
  activeServicesCount: number;
}

export default function ProviderStatsGrid({ averageRating, totalReviews, activeServicesCount }: ProviderStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mx-auto mb-3">
          <Star className="h-6 w-6 text-yellow-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {averageRating?.toFixed(1) || 'N/A'}
        </p>
        <p className="text-sm text-gray-500">Average Rating</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mx-auto mb-3">
          <Award className="h-6 w-6 text-orange-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {totalReviews || 0}
        </p>
        <p className="text-sm text-gray-500">Total Reviews</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-3">
          <Briefcase className="h-6 w-6 text-emerald-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {activeServicesCount}
        </p>
        <p className="text-sm text-gray-500">Active Services</p>
      </div>
    </div>
  );
}
