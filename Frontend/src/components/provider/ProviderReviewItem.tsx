import { Star } from 'lucide-react';
import type { ProviderServiceReview } from '../../api/serviceReviewApi';

interface ProviderReviewItemProps {
  review: ProviderServiceReview;
}

export default function ProviderReviewItem({ review }: ProviderReviewItemProps) {
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-4">
        <img
          src={review.clientAvatar}
          alt={review.clientName}
          className="w-12 h-12 rounded-full border border-gray-200 object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://picsum.photos/seed/${review.reviewerId}/60/60`;
          }}
        />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{review.clientName}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-400">{review.date}</span>
              </div>
            </div>
            {/* Service Info */}
            {typeof review.service === 'object' && review.service && (
              <div className="ml-4 text-right">
                <div className="flex items-center space-x-2">
                  {review.service.image && (
                    <img
                      src={review.service.image}
                      alt={review.service.title}
                      className="w-8 h-8 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                      {review.service.title}
                    </p>
                    <p className="text-xs text-gray-400">{review.service.category}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">{review.comment}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Service: {typeof review.service === 'object' ? review.service?.title : review.service}
            </span>
            <button className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
              Helpful ({review.helpful})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
