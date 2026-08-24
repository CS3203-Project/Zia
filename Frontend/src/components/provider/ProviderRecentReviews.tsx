import { Star, ChevronRight } from 'lucide-react';
import type { ProviderServiceReview } from '../../api/serviceReviewApi';

interface ProviderRecentReviewsProps {
  reviews: ProviderServiceReview[];
  onViewAll: () => void;
}

export default function ProviderRecentReviews({ reviews, onViewAll }: ProviderRecentReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Reviews</h2>
        <button
          onClick={onViewAll}
          className="flex items-center text-orange-600 hover:text-orange-700 text-sm font-semibold transition-colors"
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      <div className="space-y-4">
        {reviews.slice(0, 2).map((review) => (
          <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-start space-x-3">
              <img
                src={review.clientAvatar}
                alt={review.clientName}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                onError={(e) => {
                  e.currentTarget.src = `https://picsum.photos/seed/${review.reviewerId}/60/60`;
                }}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-gray-900">{review.clientName}</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-1">{review.comment}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Service: {typeof review.service === 'object' ? review.service?.title : review.service}
                  </span>
                  <span>{review.date}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
