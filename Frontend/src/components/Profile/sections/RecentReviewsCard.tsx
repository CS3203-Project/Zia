import { Star } from 'lucide-react';
import Button from '../../shared/Button';
import type { ProviderProfile } from '../../../api/userApi';

interface RecentReviewsCardProps {
  reviews: ProviderProfile['reviews'];
  averageRating?: number;
  totalReviews?: number;
}

export default function RecentReviewsCard({ reviews, averageRating, totalReviews }: RecentReviewsCardProps) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recent Reviews</h2>
          <p className="text-sm text-gray-400">
            Latest feedback from your clients
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="flex items-center space-x-1">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="text-lg font-bold text-gray-900">
                {averageRating?.toFixed(1) || 'N/A'}
              </span>
            </div>
            <p className="text-xs text-gray-400">{totalReviews || 0} reviews</p>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {reviews.slice(0, 3).map((review) => (
          <div key={review.id} className="group hover:bg-white/5 -mx-3 px-3 py-4 rounded-xl transition-colors duration-200">
            <div className="flex items-start space-x-4">
              {review.reviewer.imageUrl ? (
                <img
                  src={review.reviewer.imageUrl}
                  alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 group-hover:border-blue-400/50 transition-colors duration-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-100 group-hover:border-blue-400/50 transition-colors duration-200">
                  {(review.reviewer.firstName || '').charAt(0)}{(review.reviewer.lastName || '').charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">
                      {review.reviewer.firstName} {review.reviewer.lastName}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-500'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-yellow-300">
                        {review.rating}.0
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <blockquote className="text-gray-400 text-sm leading-relaxed border-l-3 border-blue-400/50 pl-4 italic">
                  "{review.comment}"
                </blockquote>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Reviews Button */}
      {reviews.length > 3 && (
        <div className="pt-4 border-t border-gray-200 mt-6">
          <Button
            variant="outline"
            className="w-full justify-center flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
          >
            <span>View All {totalReviews || reviews.length} Reviews</span>
            <Star className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
