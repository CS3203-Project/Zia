import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/shared/Button';

const RateCustomerPage: React.FC = () => {
  const location = useLocation();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get customerId from location.state (passed from messaging page)
  const customerId = location.state?.customerId;
  console.log('Submitting review for customerId:', customerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !customerId) return;
    const token = localStorage.getItem('token');
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ reviewerId: user.id, revieweeId: customerId, rating, comment })
    });
    if (res.ok) {
      alert('Review submitted!');
      navigate('/messaging');
    } else {
      setError('Failed to submit review');
    }
  };

  if (!customerId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
        <p className="text-rose-600">Customer info not found.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
        <p className="text-rose-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate and Review Customer</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
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
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              required
              placeholder="Share your experience working with this customer..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full shadow-orange-500/30">
            Submit Review
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RateCustomerPage;
