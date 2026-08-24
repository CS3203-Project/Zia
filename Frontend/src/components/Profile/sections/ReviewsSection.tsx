import { ChevronRight, Star } from 'lucide-react';

export interface CustomerReview {
  id?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
  reviewer?: {
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  };
}

export interface ServiceReview {
  id?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
  date?: string;
  clientName?: string;
  clientAvatar?: string;
  reviewerId?: string;
  service?: string | { title?: string };
}

interface ReviewsSectionProps {
  customerReviews: CustomerReview[];
  serviceReviews: ServiceReview[];
  reviewsLoading: boolean;
  selectedReviewType: 'customer' | 'service';
  onReviewTypeChange: (type: 'customer' | 'service') => void;
  /** Whether the "Reviews from Customers" option should appear in the dropdown. */
  showServiceOption: boolean;
}

export default function ReviewsSection({
  customerReviews,
  serviceReviews,
  reviewsLoading,
  selectedReviewType,
  onReviewTypeChange,
  showServiceOption
}: ReviewsSectionProps) {
  return (
    <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">My Reviews</h2>
          <p className="text-sm text-gray-500 font-medium">
            {selectedReviewType === 'customer'
              ? 'Feedback received from service providers'
              : 'Customer feedback on your services'
            }
          </p>
        </div>

        {/* Review Type Dropdown */}
        <div className="relative">
          <select
            value={selectedReviewType}
            onChange={(e) => onReviewTypeChange(e.target.value as 'customer' | 'service')}
            className="px-4 py-2 pr-8 bg-white/80 border border-white/30 rounded-xl text-sm font-medium text-gray-900 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/20 transition-all duration-200 hover:bg-white/90 appearance-none"
          >
            {customerReviews.length > 0 && (
              <option value="customer" className="bg-white text-gray-900">⭐ Reviews from Providers</option>
            )}
            {showServiceOption && (
              <option value="service" className="bg-white text-gray-900">Reviews from Customers</option>
            )}
          </select>
          <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-900 h-4 w-4 pointer-events-none rotate-90" />
        </div>
      </div>

      {reviewsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
          <p className="text-gray-500">Loading reviews...</p>
        </div>
      ) : selectedReviewType === 'customer' && customerReviews.length > 0 ? (
        <div className="space-y-6">
          {customerReviews.slice(0, 5).map((review, index) => (
            <div key={review.id || index} className="group border border-gray-100 rounded-xl p-4 bg-white/30 backdrop-blur-sm hover:border-white/40 transition-all duration-300">
              <div className="flex items-start space-x-4">
                {review.reviewer?.imageUrl ? (
                  <img
                    src={review.reviewer.imageUrl}
                    alt={`${review.reviewer?.firstName || 'Provider'} ${review.reviewer?.lastName || ''}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/40"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-white/40">
                    {((review.reviewer?.firstName || 'P').charAt(0) || 'P').toUpperCase()}
                    {((review.reviewer?.lastName || '').charAt(0) || 'R').toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-base">
                        {review.reviewer?.firstName || 'Provider'} {review.reviewer?.lastName || ''}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < (review.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-yellow-600">
                          {review.rating || 0}.0
                        </span>
                        <span className="text-sm text-gray-400">• Provider</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-400">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <blockquote className="text-gray-500 text-sm leading-relaxed border-l-4 border-blue-500/30 pl-4 italic bg-white/50 p-3 rounded-r-lg">
                      "{review.comment || 'No comment provided'}"
                    </blockquote>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {customerReviews.length > 5 && (
            <div className="text-center pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500 font-medium">
                Showing 5 of {customerReviews.length} reviews
              </span>
            </div>
          )}
        </div>
      ) : selectedReviewType === 'service' && serviceReviews.length > 0 ? (
        <div className="space-y-6">
          {serviceReviews.slice(0, 5).map((review, index) => (
            <div key={review.id || index} className="group border border-gray-100 rounded-xl p-4 bg-white/30 backdrop-blur-sm hover:border-white/40 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <img
                  src={review.clientAvatar || `https://picsum.photos/seed/${review.reviewerId}/60/60`}
                  alt={review.clientName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/40"
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/seed/${review.reviewerId}/60/60`;
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-base">
                        {review.clientName || 'Anonymous Customer'}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < (review.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-yellow-600">
                          {review.rating || 0}.0
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-400">
                          {typeof review.service === 'object' ? review.service?.title : review.service || 'Service'}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-400">
                          {review.date || (review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'N/A')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <blockquote className="text-gray-500 text-sm leading-relaxed border-l-4 border-blue-500/30 pl-4 italic bg-white/50 p-3 rounded-r-lg">
                      "{review.comment || 'No comment provided'}"
                    </blockquote>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {serviceReviews.length > 5 && (
            <div className="text-center pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500 font-medium">
                Showing 5 of {serviceReviews.length} reviews
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500 text-sm">
            {selectedReviewType === 'customer'
              ? 'Reviews from service providers will appear here once you receive feedback.'
              : 'Reviews from customers will appear here once you receive feedback on your services.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
