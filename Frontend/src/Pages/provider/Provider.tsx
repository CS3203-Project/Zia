import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Award,
  ExternalLink,
  Clock
} from 'lucide-react';
import { userApi } from '../../api/userApi';
import { serviceApi } from '../../api/serviceApi';
import { serviceReviewApi } from '../../api/serviceReviewApi';
import { hybridSearchApi } from '../../api/hybridSearchApi';
import type { UserProfile, ProviderProfile } from '../../api/userApi';
import type { ServiceResponse } from '../../api/serviceApi';
import type { ProviderServiceReview, ReviewStats } from '../../api/serviceReviewApi';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import Button from '../../components/shared/Button';
import ServiceLocationMap from '../../components/shared/ServiceLocationMap';
import ProviderTabs, { type ProviderTabId } from '../../components/provider/ProviderTabs';
import ProviderStatsGrid from '../../components/provider/ProviderStatsGrid';
import ProviderServicesGrid from '../../components/provider/ProviderServicesGrid';
import ProviderReviewsPanel from '../../components/provider/ProviderReviewsPanel';
import ProviderRecentReviews from '../../components/provider/ProviderRecentReviews';

const skillPillClasses = "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-orange-50 text-orange-700 border border-orange-100";

export default function Provider() {
  const navigate = useNavigate();
  const { id: providerId } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProviderTabId>('overview');
  const [reviewFilter, setReviewFilter] = useState('all');

  // Real review data state
  const [reviews, setReviews] = useState<ProviderServiceReview[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  // Provider address geocoded to coordinates for the directions map (there's no stored
  // lat/lng for users/providers, only a free-text address, unlike services).
  const [geocodedLocation, setGeocodedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch services for the current provider
  const fetchServices = async (providerId: string) => {
    try {
      setServicesLoading(true);
      const response = await serviceApi.getServices({ providerId });
      if (response.success) {
        setServices(response.data);
      } else {
        console.error('Failed to fetch services:', response.message);
        setServices([]);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error('Failed to load services');
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  // Fetch reviews for the current provider
  const fetchProviderReviews = async (providerId: string, page = 1, reset = false) => {
    try {
      setReviewsLoading(true);

      const ratingFilter = reviewFilter === 'all' ? undefined : parseInt(reviewFilter);
      const response = await serviceReviewApi.getProviderServiceReviews(providerId, {
        page,
        limit: 10,
        rating: ratingFilter
      });

      if (response.success) {
        if (reset) {
          setReviews(response.data.reviews);
        } else {
          setReviews(prev => [...prev, ...response.data.reviews]);
        }
        setReviewPage(page);
        setHasMoreReviews(page < response.data.pagination.totalPages);
      } else {
        console.error('Failed to fetch reviews:', response.message);
        if (reset) setReviews([]);
      }
    } catch (error) {
      console.error('Failed to fetch provider reviews:', error);
      toast.error('Failed to load reviews');
      if (reset) setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch review statistics for the provider
  const fetchProviderReviewStats = async (providerId: string) => {
    try {
      const response = await serviceReviewApi.getProviderReviewStats(providerId);
      if (response.success) {
        setReviewStats(response.data);
      } else {
        console.error('Failed to fetch review stats:', response.message);
      }
    } catch (error) {
      console.error('Failed to fetch provider review stats:', error);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);

      console.log('Provider ID from URL:', providerId); // Debug log

      if (!providerId) {
        console.log('No provider ID found'); // Debug log
        toast.error('Provider ID is required');
        navigate('/');
        return;
      }

      // Fetch the specified provider's profile
      try {
        console.log('Attempting to fetch provider profile for ID:', providerId); // Debug log
        const providerData = await userApi.getProviderById(providerId);
        console.log('Provider data received:', providerData); // Debug log
        setProviderProfile(providerData);
        setUser(providerData.user as UserProfile);

        // Fetch services, reviews, and review stats for this provider concurrently —
        // these three calls are independent of one another.
        if (providerData.id) {
          await Promise.all([
            fetchServices(providerData.id),
            fetchProviderReviews(providerData.id, 1, true),
            fetchProviderReviewStats(providerData.id)
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch provider profile:', error);
        // Instead of immediately redirecting, show an error state
        // toast.error('Provider not found');
        // navigate('/');

        // Let's see what the actual error is
        console.error('Error details:', error);
        toast.error('Failed to load provider profile. Please try again.');
        setUser(null);
        setProviderProfile(null);
      }
    } catch (error: unknown) {
      console.error('Outer catch error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [providerId, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [providerId, fetchProfile]);

  // Geocode the provider's free-text address once it's loaded, so a directions map can be
  // shown. Runs once per address (not on every render), and only when an address exists.
  useEffect(() => {
    const address = user?.address || user?.location;
    if (!address) {
      setGeocodedLocation(null);
      return;
    }

    let cancelled = false;
    hybridSearchApi
      .geocodeAddress(address)
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.data?.latitude !== undefined && response.data?.longitude !== undefined) {
          setGeocodedLocation({ latitude: response.data.latitude, longitude: response.data.longitude });
        } else {
          setGeocodedLocation(null);
        }
      })
      .catch((error) => {
        // Background lookup — fail quietly and just keep the text-only address display.
        console.error('Failed to geocode provider address:', error);
        if (!cancelled) setGeocodedLocation(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.address, user?.location]);

  // Effect to refetch reviews when filter changes
  useEffect(() => {
    if (providerProfile?.id && activeTab === 'reviews') {
      fetchProviderReviews(providerProfile.id, 1, true);
    }
  }, [reviewFilter, activeTab, providerProfile?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
        <div className="flex-1 flex items-center justify-center mt-16">
          <div className="text-center">
            <div className="flex gap-1 justify-center mb-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="mt-4 text-gray-500 font-medium">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
        <div className="flex-1 flex items-center justify-center mt-16">
          <div className="text-center bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h3>
            <p className="text-gray-500 mb-6">
              The provider profile you're looking for could not be found.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/services')}>
                Browse Services
              </Button>
              <Button onClick={() => navigate('/')} variant="outline">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have user data, render the main component
  if (!user) {
    return null; // This should not happen due to the check above, but satisfies TypeScript
  }
   return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-8 w-full">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-8 border border-gray-100">
          {/* Banner */}
          <div className="relative h-36 bg-gradient-to-r from-orange-500 to-amber-600">
        <img
          src="https://4kwallpapers.com/images/walls/thumbs_3t/8728.jpg"
          alt="Profile Banner"
          className="w-full h-full object-cover opacity-30"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Avatar - half above the banner */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-16 z-10">
          <div className="relative">
            {user.imageUrl && user.imageUrl.trim() ? (
          <img
            src={user.imageUrl}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover bg-gray-100"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const defaultAvatar = img.nextElementSibling as HTMLElement;
              if (defaultAvatar) defaultAvatar.style.display = 'flex';
            }}
          />
            ) : null}
            <div
          className={`w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-3xl font-bold ${
            user.imageUrl && user.imageUrl.trim() ? 'hidden' : 'flex'
          }`}
            >
          {((user.firstName || '').charAt(0) || 'U').toUpperCase()}
          {((user.lastName || '').charAt(0) || 'S').toUpperCase()}
            </div>
          </div>
        </div>
          </div>
          {/* Header Content */}
          <div className="px-4 sm:px-6 pb-6">
        <div className="flex flex-col lg:flex-row items-center lg:items-end lg:space-x-8 mt-0">
          {/* Spacer for avatar */}
          <div className="w-32 h-16 lg:hidden" />
          {/* Info & Actions */}
          <div className="flex-1 text-center lg:text-left ml-5 mt-13 lg:mt-0">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-4 mb-1">
              {user.firstName || 'First'} {user.lastName || 'Last'}
            </h1>
            <p className="text-gray-500 text-lg mb-1">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2">
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-orange-50 text-orange-700 border border-orange-100">
            {user.role === 'PROVIDER' ? 'Service Provider' : 'User'}
              </span>
              {user.isEmailVerified && (
            <span className="flex items-center text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <Shield className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Verified</span>
            </span>
              )}
              {user.phone && (
            <span className="flex items-center text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              <Phone className="h-4 w-4 mr-1" />
              <span className="text-xs">{user.phone}</span>
            </span>
              )}
              {user.location && (
            <span className="flex items-center text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-xs">{user.location}</span>
            </span>
              )}
            </div>
          </div>
            </div>
            {/* Social Media Links */}
          </div>
        </div>
          </div>
        </div>

        {/* Only show tabs for verified providers */}
        {providerProfile && providerProfile.isVerified && (
          <ProviderTabs activeTab={activeTab} onTabChange={setActiveTab} />
        )}

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-900 font-medium">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="text-gray-900 font-medium">{user.location}</p>
                    </div>
                  </div>
                )}

                {user.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-900 font-medium">{user.address}</p>
                    </div>
                  </div>
                )}

                {geocodedLocation && (
                  <ServiceLocationMap
                    destination={geocodedLocation}
                    destinationLabel={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Provider'}
                  />
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Member since</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {user.socialmedia && user.socialmedia.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <ExternalLink className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Social Media</p>
                      <div className="space-y-2">
                        {user.socialmedia.map((link, index) => (
                          <a
                            key={index}
                            href={link.startsWith('http') ? link : `https://${link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-orange-600 hover:underline text-sm font-medium"
                          >
                            <ExternalLink className="h-3 w-3 mr-2" />
                            {link}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Provider-specific content */}
          <div className="lg:col-span-2">
            {providerProfile ? (
              // Check if provider is verified
              providerProfile.isVerified === false ? (
                /* Unverified Provider */
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="p-3 bg-amber-100 rounded-full inline-flex mb-4">
                      <Clock className="h-12 w-12 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verification in Progress</h2>
                    <p className="text-gray-500 mb-6">
                      Your provider profile has been submitted and is currently under review.
                      Our team is verifying your information and credentials.
                    </p>
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6 text-left">
                      <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• We'll review your profile and credentials</li>
                        <li>• You'll receive an email once verification is complete</li>
                        <li>• Verification typically takes 1-3 business days</li>
                        <li>• Once verified, you can start adding services</li>
                      </ul>
                    </div>

                    {/* Show basic provider info */}
                    <div className="mt-8 text-left">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Submitted Information</h3>
                      <div className="space-y-4">
                        {providerProfile.bio && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Bio</h4>
                            <p className="text-gray-500 text-sm">{providerProfile.bio}</p>
                          </div>
                        )}

                        {providerProfile.skills && providerProfile.skills.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {providerProfile.skills.map((skill, index) => (
                                <span key={index} className={skillPillClasses}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {providerProfile.qualifications && providerProfile.qualifications.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Qualifications</h4>
                            <div className="space-y-1">
                              {providerProfile.qualifications.map((qualification, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Award className="h-4 w-4 text-orange-600" />
                                  <span className="text-gray-600 text-sm">{qualification}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Verified Provider - tabbed content */
                <div className="space-y-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <>
                      {/* Provider Stats */}
                      <ProviderStatsGrid
                        averageRating={reviewStats?.averageRating}
                        totalReviews={reviewStats?.totalReviews}
                        activeServicesCount={services.filter(s => s.isActive).length}
                      />

                      {/* Bio */}
                      {providerProfile.bio && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                          <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                          <p className="text-gray-600">{providerProfile.bio}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {providerProfile.skills && providerProfile.skills.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                          <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
                          <div className="flex flex-wrap gap-2">
                            {providerProfile.skills.map((skill, index) => (
                              <span key={index} className={skillPillClasses}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Qualifications */}
                      {providerProfile.qualifications && providerProfile.qualifications.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                          <h2 className="text-xl font-semibold text-gray-900 mb-4">Qualifications</h2>
                          <div className="space-y-2">
                            {providerProfile.qualifications.map((qualification, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Award className="h-4 w-4 text-orange-600" />
                                <span className="text-gray-600">{qualification}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Reviews */}
                      <ProviderRecentReviews reviews={reviews} onViewAll={() => setActiveTab('reviews')} />
                    </>
                  )}

                  {/* Services Tab */}
                  {activeTab === 'services' && (
                    <ProviderServicesGrid
                      services={services}
                      loading={servicesLoading}
                      onServiceClick={(serviceId) => navigate(`/service/${serviceId}`)}
                    />
                  )}



                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
                    <ProviderReviewsPanel
                      reviews={reviews}
                      reviewStats={reviewStats}
                      reviewFilter={reviewFilter}
                      onFilterChange={setReviewFilter}
                      reviewsLoading={reviewsLoading}
                      hasMoreReviews={hasMoreReviews}
                      onLoadMore={() => providerProfile?.id && fetchProviderReviews(providerProfile.id, reviewPage + 1, false)}
                    />
                  )}

                  {/* About Tab */}
                  {activeTab === 'about' && (
                    <div className="space-y-6">
                      {/* About Profile */}
                      {providerProfile.bio && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">About Profile</h3>
                          <p className="text-gray-600 leading-relaxed">{providerProfile.bio}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {providerProfile.skills && providerProfile.skills.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {providerProfile.skills.map((skill, index) => (
                              <span key={index} className={skillPillClasses}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Qualifications */}
                      {providerProfile.qualifications && providerProfile.qualifications.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Qualifications</h3>
                          <div className="space-y-3">
                            {providerProfile.qualifications.map((qualification, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <Award className="h-5 w-5 text-orange-600" />
                                <span className="text-gray-600">{qualification}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Member Since */}
                      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Member Since</h3>
                        <div className="flex items-center space-x-3 mb-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">Last active: Recently</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Loading provider data */
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading provider profile...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}

      <Toaster />
    </div>
  );

}
