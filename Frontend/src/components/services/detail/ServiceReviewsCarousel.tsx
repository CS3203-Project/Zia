import React from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import type { ServiceReview, ReviewStats } from '../../../api/serviceReviewApi';
import { cn } from '../../../utils/utils';

interface ServiceReviewsCarouselProps {
  reviews: ServiceReview[];
  reviewStats: ReviewStats;
  averageRating: number;
  reviewsLoading: boolean;
  currentReviewIndex: number;
  onReviewIndexChange: (index: number) => void;
  reviewsScrollRef: React.RefObject<HTMLDivElement>;
}

/**
 * Customer reviews carousel (auto-scrolling slider + dot navigation),
 * plus the "no reviews yet" empty state.
 */
const ServiceReviewsCarousel: React.FC<ServiceReviewsCarouselProps> = ({
  reviews,
  reviewStats,
  averageRating,
  reviewsLoading,
  currentReviewIndex,
  onReviewIndexChange,
  reviewsScrollRef
}) => {
  if (reviews.length === 0) {
    if (reviewsLoading) return null;
    return (
      <div className="mb-6 text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-lg">
          No reviews yet. Be the first to review this service!
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Customer Reviews
        </h2>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <span className="text-lg font-semibold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">
            ({reviewStats.totalReviews})
          </span>
        </div>
      </div>

      {/* Enhanced Reviews Slider */}
      <div className="relative">
        <div
          ref={reviewsScrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 scroll-smooth"
          onScroll={(e) => {
            const scrollLeft = e.currentTarget.scrollLeft;
            const cardWidth = e.currentTarget.scrollWidth / reviews.length;
            const newIndex = Math.round(scrollLeft / cardWidth);
            onReviewIndexChange(newIndex);
          }}
        >
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="flex-shrink-0 w-[90%] sm:w-[45%] lg:w-[32%] snap-start"
            >
              <div className={cn(
                "bg-white rounded-3xl p-8 border border-gray-100 h-full transition-all duration-500",
                index === currentReviewIndex
                  ? "shadow-xl scale-105 border-orange-200"
                  : "shadow-sm hover:shadow-lg"
              )}>
                {/* Review Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 shadow-lg">
                      {review.clientAvatar ? (
                        <img
                          src={review.clientAvatar}
                          alt={review.clientName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                          <span className="text-2xl text-gray-900 font-bold">
                            {review.clientName?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Verified badge */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {review.clientName || 'Anonymous'}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Rating Stars - White */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className={cn(
                        "w-5 h-5 transition-all",
                        starIndex < review.rating
                          ? "fill-amber-400 text-amber-400 drop-shadow-lg"
                          : "fill-none text-gray-300"
                      )}
                    />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-gray-900">
                    {review.rating}.0
                  </span>
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <div className="relative">
                    <p className="text-base text-gray-500 leading-relaxed line-clamp-5 italic">
                      "{review.comment}"
                    </p>
                  </div>
                )}

                {/* Helpful indicator */}
                {review.helpful > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      {review.helpful} found this helpful
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Dots */}
        {reviews.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, index) => (
              <button
                key={index}
                aria-label={`Go to review ${index + 1}`}
                onClick={() => {
                  onReviewIndexChange(index);
                  if (reviewsScrollRef.current) {
                    const cardWidth = reviewsScrollRef.current.scrollWidth / reviews.length;
                    reviewsScrollRef.current.scrollTo({
                      left: cardWidth * index,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={cn(
                  "transition-all duration-300 rounded-full",
                  index === currentReviewIndex
                    ? "w-8 h-2 bg-orange-500"
                    : "w-2 h-2 bg-gray-200 hover:bg-gray-400"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceReviewsCarousel;
