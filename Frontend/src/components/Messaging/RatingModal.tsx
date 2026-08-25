import React, { useState, useEffect } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import apiClient from '../../api/axios';
import { serviceApi } from '../../api/serviceApi';
import type { ConversationWithLastMessage } from '../../api/messagingApi';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratingType: 'customer' | 'service';
  conversation?: ConversationWithLastMessage;
  conversationId?: string;
  currentUserId: string;
  serviceData?: any;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  ratingType,
  conversation,
  conversationId,
  currentUserId,
  serviceData
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [hoverRating, setHoverRating] = useState(0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setComment('');
      setError(null);
      setSuccess(false);
      setExistingReview(null);
      fetchExistingReview();
    }
  }, [isOpen]);

  const fetchExistingReview = async () => {
    try {
      if (ratingType === 'service') {
        const serviceToRate = serviceData;
        if (!serviceToRate) return;

        const res = await apiClient.get(`/service-reviews/service/${serviceToRate.id}`);
        const userId = localStorage.getItem('userId');
        const review = res.data.reviews.find((r: any) => r.reviewer?.id === userId);
        if (review) {
          setExistingReview(review);
          setRating(review.rating);
          setComment(review.comment || '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch existing review:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      if (ratingType === 'customer') {
        // Rate customer
        const customerId = conversation?.userIds.find(id => id !== currentUserId);
        if (!customerId) throw new Error('Customer not found');

        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            reviewerId: currentUserId,
            revieweeId: customerId,
            rating,
            comment
          })
        });

        if (!res.ok) throw new Error('Failed to submit review');
      } else {
        // Rate service
        const serviceToRate = serviceData;
        if (!serviceToRate) throw new Error('Service information not available');

        if (existingReview) {
          await apiClient.patch(`/service-reviews/${existingReview.id}`, { rating, comment });
        } else {
          await apiClient.post('/service-reviews', { serviceId: serviceToRate.id, rating, comment });
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative z-10 p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {ratingType === 'customer' ? '⭐ Rate Customer' : '⭐ Rate Service'}
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Stars */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Rating (1-5 stars)
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl transition-all duration-200 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300 hover:text-amber-300'
                      } transition-colors duration-200`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-500">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={ratingType === 'customer' ? 'Share your experience with this customer...' : 'Share your experience with this service...'}
                rows={4}
                className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-emerald-600 text-sm">
                  {existingReview ? 'Review updated successfully!' : 'Review submitted successfully!'}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-300 font-medium border border-gray-200 hover:border-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 font-medium border border-orange-500 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
