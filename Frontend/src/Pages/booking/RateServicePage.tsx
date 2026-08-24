import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../../api/axios';
import { serviceApi } from '../../api/serviceApi';
import Button from '../../components/shared/Button';

const RateServicePage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);

    // Try to fetch service directly first
    const fetchServiceData = async () => {
      try {
        // First, try to get service by ID directly
        const response = await serviceApi.getServiceById(serviceId);
        if (response.success) {
          setService(response.data);
          return response.data;
        }
      } catch (error) {
        console.log('Failed to get service by ID, trying conversation ID:', error);

        // If direct service fetch fails, try getting service by conversation ID
        try {
          const conversationResponse = await serviceApi.getServiceByConversationId(serviceId);
          if (conversationResponse.success) {
            setService(conversationResponse.data);
            return conversationResponse.data;
          }
        } catch (conversationError) {
          console.error('Failed to get service by conversation ID:', conversationError);
          setError('Failed to load service');
          return null;
        }
      }
      return null;
    };

    // Fetch service and then reviews
    fetchServiceData().then((serviceData) => {
      if (serviceData) {
        // Fetch existing review by this user (if any)
        apiClient.get(`/service-reviews/service/${serviceData.id}`)
          .then(res => {
            // Assume backend returns reviews with reviewerId, get the one for this user
            const userId = localStorage.getItem('userId');
            const review = res.data.reviews.find((r: any) => r.reviewer?.id === userId);
            if (review) {
              setExistingReview(review);
              setRating(review.rating);
              setComment(review.comment || '');
            }
          })
          .catch(() => {/* ignore */});
      }
      setLoading(false);
    });
  }, [serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!service) {
      setError('Service information not available');
      return;
    }

    try {
      if (existingReview) {
        await apiClient.patch(`/service-reviews/${existingReview.id}`, { rating, comment });
        setSuccess('Review updated!');
      } else {
        await apiClient.post('/service-reviews', { serviceId: service.id, rating, comment });
        setSuccess('Review submitted!');
      }
      setTimeout(() => navigate(-1), 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
        <p className="text-gray-500">Service not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Rate Service</h2>
        <p className="text-gray-500 mb-6">{service.title || 'Service'}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full"
                >
                  <Star
                    className={`h-9 w-9 transition-colors ${
                      star <= (hoverRating || rating) ? 'text-amber-500' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full shadow-orange-500/30">
            {existingReview ? 'Update Review' : 'Submit Review'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RateServicePage;
