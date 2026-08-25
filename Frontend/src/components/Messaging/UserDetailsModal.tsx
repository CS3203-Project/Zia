import React, { useState, useEffect } from 'react';
import { X, Star, User, MapPin, Phone, Mail, Calendar, Award, Building } from 'lucide-react';
import { userApi } from '../../api/userApi';
import { serviceApi } from '../../api/serviceApi';
import apiClient from '../../api/axios';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'USER' | 'PROVIDER';
  conversationId: string;
  currentUserId: string;
}

interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  imageUrl?: string;
  bio?: string;
  skills?: string[];
  qualifications?: string[];
  averageRating?: number;
  totalReviews?: number;
  isVerified?: boolean;
  location?: string;
  address?: string;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  userRole,
  conversationId,
  currentUserId
}) => {
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUserDetails();
    }
  }, [isOpen, userRole, conversationId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      if (userRole === 'PROVIDER') {
        // Provider viewing customer details
        // Need to get conversation to find customer ID
        const conversationRes = await fetch(`${import.meta.env.PROD 
          ? import.meta.env.VITE_API_BASE_URL_MESSAGES_PROD
          : import.meta.env.VITE_API_BASE_URL_MESSAGES}/conversations/${conversationId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!conversationRes.ok) {
          throw new Error('Failed to fetch conversation details');
        }

        const conversation = await conversationRes.json();
        const customerId = conversation.userIds.find((id: string) => id !== currentUserId);

        if (!customerId) {
          throw new Error('Customer not found');
        }

        // Get customer profile
        const customerProfile = await userApi.getUserById(customerId);
        const customerData: any = customerProfile;
        const serviceProvider: any = customerData.serviceProvider;

        setUserDetails({
          id: customerData.id || '',
          firstName: customerData.firstName || '',
          lastName: customerData.lastName || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          imageUrl: customerData.imageUrl || '',
          bio: serviceProvider?.bio || '',
          skills: serviceProvider?.skills || [],
          qualifications: serviceProvider?.qualifications || [],
          averageRating: serviceProvider?.averageRating,
          totalReviews: serviceProvider?.totalReviews,
          isVerified: serviceProvider?.isVerified || false,
          location: customerData.location || '',
          address: customerData.address || ''
        });

        // Get reviews received by this customer (reviews given TO this customer)
        try {
          const reviewsRes = await apiClient.get(`/reviews/user/${customerId}/received`);
          console.log('Reviews API response:', reviewsRes.data);
          const reviewData = reviewsRes.data.reviews || reviewsRes.data || [];
          setReviews(reviewData);
        } catch (error) {
          console.error('Error fetching customer reviews:', error);
          setReviews([]);
        }

      } else {
        // Customer viewing service provider details
        const serviceRes = await serviceApi.getServiceByConversationId(conversationId);
        if (!serviceRes.success || !serviceRes.data?.provider) {
          throw new Error('Provider information not found');
        }

        const providerData: any = serviceRes.data.provider;
        const providerUser: any = providerData.user || {};

        setUserDetails({
          id: providerUser.id || providerData.id || '',
          firstName: providerUser.firstName || '',
          lastName: providerUser.lastName || '',
          email: providerUser.email || providerData.email || '',
          phone: providerUser.phone || '',
          imageUrl: providerUser.imageUrl || '',
          bio: providerData.bio || '',
          skills: providerData.skills || [],
          qualifications: providerData.qualifications || [],
          averageRating: providerData.averageRating,
          totalReviews: providerData.totalReviews,
          isVerified: providerData.isVerified || false,
          location: providerUser.location || '',
          address: providerUser.address || ''
        });

        // Get service reviews for this service
        try {
          const reviewsRes = await apiClient.get(`/service-reviews/service/${serviceRes.data.id}`);
          setReviews(reviewsRes.data.reviews || []);
        } catch {
          setReviews([]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user details');
      console.error('Error fetching user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative z-10 p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              {userRole !== 'PROVIDER' && <Building className="w-5 h-5 mr-2 text-orange-600" />}
              {userRole === 'PROVIDER' ? 'Customer Details' : 'Service Provider Details'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-orange-500"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {userDetails && !loading && (
            <div className="space-y-6">
              {/* User Profile Section */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                    {userDetails.firstName?.[0]}{userDetails.lastName?.[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900">
                      {userDetails.firstName} {userDetails.lastName}
                    </h3>

                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{userDetails.email}</span>
                      </div>

                      {userDetails.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{userDetails.phone}</span>
                        </div>
                      )}

                      {userDetails.isVerified && (
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600">Verified</span>
                        </div>
                      )}
                    </div>

                    {userDetails.location && (
                      <div className="flex items-center space-x-1 mt-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{userDetails.location}</span>
                      </div>
                    )}

                    {userDetails.averageRating && (
                      <div className="flex items-center space-x-2 mt-3">
                        <span className="text-gray-900 font-medium">{userDetails.averageRating.toFixed(1)}</span>
                        {renderStars(Math.round(userDetails.averageRating))}
                        <span className="text-gray-500 text-sm">
                          ({userDetails.totalReviews || 0} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {userDetails.bio && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Bio</h4>
                    <p className="text-sm text-gray-600">{userDetails.bio}</p>
                  </div>
                )}

                {(userDetails.skills?.length || userDetails.qualifications?.length) && (
                  <div className="mt-4 space-y-3">
                    {userDetails.skills && userDetails.skills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {userDetails.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {userDetails.qualifications && userDetails.qualifications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Qualifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {userDetails.qualifications.map((qual, index) => (
                            <span key={index} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs">
                              {qual}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              {reviews.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {userRole === 'PROVIDER' ? 'Reviews Given to Customer' : 'Service Reviews & Ratings'}
                  </h4>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                              {userRole === 'PROVIDER'
                                ? review.reviewer?.firstName?.[0] || review.reviewee?.firstName?.[0] || '?'
                                : review.reviewer?.firstName?.[0] || review.reviewee?.firstName?.[0] || '?'}
                            </div>
                            <div>
                              <p className="text-gray-900 font-medium">
                                {/* A template literal is always truthy, so the old
                                    `...` || 'Unknown' fallback was dead code and a
                                    missing name rendered as "undefined undefined".
                                    Build the name first, then fall back. */}
                                {(() => {
                                  const person =
                                    userRole === 'PROVIDER' ? review.reviewee : review.reviewer;
                                  const name =
                                    [person?.firstName, person?.lastName].filter(Boolean).join(' ') ||
                                    'Unknown';
                                  return userRole === 'PROVIDER' ? `Given to: ${name}` : `By: ${name}`;
                                })()}
                              </p>
                              <div className="flex items-center space-x-2">
                                {renderStars(review.rating)}
                                <span className="text-gray-500 text-sm">{review.rating}/5</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-gray-400">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {review.comment && (
                          <p className="text-gray-600 text-sm">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reviews.length === 0 && !loading && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews available yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
