import { Star } from 'lucide-react';
import type { ProviderServiceReview, ReviewStats } from '../../api/serviceReviewApi';
import Button from '../shared/Button';
import ProviderReviewItem from './ProviderReviewItem';

interface ProviderReviewsPanelProps {
  reviews: ProviderServiceReview[];
  reviewStats: ReviewStats | null;
  reviewFilter: string;
  onFilterChange: (filter: string) => void;
  reviewsLoading: boolean;
  hasMoreReviews: boolean;
  onLoadMore: () => void;
}

export default function ProviderReviewsPanel({
  reviews,
  reviewStats,
  reviewFilter,
  onFilterChange,
  reviewsLoading,
  hasMoreReviews,
  onLoadMore
}: ProviderReviewsPanelProps) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Reviews ({reviewStats?.totalReviews || 0})
            </h3>
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(reviewStats?.averageRating || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {reviewStats?.averageRating?.toFixed(1) || 0} out of 5
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <select
              value={reviewFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
              disabled={reviewsLoading}
            >
              <option value="all">All Reviews</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {reviewsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {!reviewsLoading && (
        <div className="divide-y divide-gray-100">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ProviderReviewItem key={review.id} review={review} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400">
                <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                <p className="text-gray-500 mb-4">
                  This provider hasn't received any reviews yet.
                </p>
              </div>
            </div>
          )}

          {/* Load More Button */}
          {hasMoreReviews && !reviewsLoading && (
            <div className="p-6 text-center border-t border-gray-100">
              <Button onClick={onLoadMore}>
                Load More Reviews
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
