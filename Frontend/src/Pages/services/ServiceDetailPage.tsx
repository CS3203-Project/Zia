import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Calendar,
  CheckCircle, User,
  DollarSign
} from 'lucide-react';
import { serviceApi, type ServiceResponse } from '../../api/serviceApi';
import { serviceReviewApi, type ServiceReview, type ReviewStats } from '../../api/serviceReviewApi';
import { userApi, type ProviderProfile } from '../../api/userApi';
import { messagingApi } from '../../api/messagingApi';
import { bookingApi, getBookingTimeline, type Booking } from '../../api/bookingApi';
import ExistingBookingPrompt from '../../components/services/detail/ExistingBookingPrompt';
import { debugMessagingState } from '../../utils/messagingDebug';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumb from '../../components/services/Breadcrumb';
import toast from 'react-hot-toast';
import { cn } from '../../utils/utils';
import Button from '@/components/shared/Button';
import Chip from '@/components/shared/Chip';
import * as QRCodeLib from 'qrcode';
import ServiceDetailSkeleton from '../../components/services/detail/ServiceDetailSkeleton';
import ServiceReviewsCarousel from '../../components/services/detail/ServiceReviewsCarousel';
import ServiceBookingSidebar from '../../components/services/detail/ServiceBookingSidebar';
import ServiceVideoBanner from '../../components/services/detail/ServiceVideoBanner';
import ServiceHeroGallery from '../../components/services/detail/ServiceHeroGallery';
import ServicePhotoGallery from '../../components/services/detail/ServicePhotoGallery';
import ServiceLocationMap from '../../components/shared/ServiceLocationMap';

export interface DetailedService {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  videoUrl?: string;
  category: {
    name: string;
    slug: string;
  };
  tags: string[];
  workingTime: string[];
  // Location fields
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  serviceRadiusKm?: number;
  locationLastUpdated?: string;
  provider: {
    id?: string;
    name: string;
    email?: string;
    avatar?: string;
    rating?: number;
    reviews?: number;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  console.log('ServiceDetailPage - serviceId from URL:', serviceId);
  const [service, setService] = useState<DetailedService | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerLoading, setProviderLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [autoSlide, setAutoSlide] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false); // Track if video is currently playing

  // Reviews state
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  // Reviews carousel state
  const reviewsScrollRef = React.useRef<HTMLDivElement>(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  
  // Payment modal state
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // QR code state
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Schedule state
  const [currentSchedules, setCurrentSchedules] = useState<{ startTime: string; endTime: string }[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Whether this viewer already has a booking here, so the CTA can say whether it
  // reopens that thread or starts a fresh request.
  const [activeBookingStatus, setActiveBookingStatus] = useState<string | null>(null);
  const [hasPastBooking, setHasPastBooking] = useState(false);
  // Set when Book Now finds an open booking, so we can ask before acting.
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);

  // Auto-slide effect for images only (video is now separate)
  useEffect(() => {
    if (autoSlide && service?.images.length > 1) {
      const interval = setInterval(() => {
        setSelectedImage((prevIndex) => (prevIndex + 1) % service.images.length);
      }, 4000); // Change images every 4 seconds

      return () => clearInterval(interval);
    }
  }, [autoSlide, service?.images.length]);

  // Auto-scroll reviews carousel
  useEffect(() => {
    if (reviews.length > 1 && reviewsScrollRef.current) {
      const interval = setInterval(() => {
        setCurrentReviewIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % reviews.length;
          
          // Smooth scroll to next review
          if (reviewsScrollRef.current) {
            const cardWidth = reviewsScrollRef.current.scrollWidth / reviews.length;
            reviewsScrollRef.current.scrollTo({
              left: cardWidth * nextIndex,
              behavior: 'smooth'
            });
          }
          
          return nextIndex;
        });
      }, 5000); // Change review every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [reviews.length]);

  // Generate QR code URL for sharing
  useEffect(() => {
    if (service) {
      const currentUrl = window.location.href;
      setQrCodeUrl(currentUrl);
    }
  }, [service]);

  // Transform ServiceResponse (API data) to DetailedService format
  const transformApiService = (apiService: ServiceResponse): DetailedService => {
    console.log('🔄 Transforming API service data:', apiService);
    console.log('🏢 Service provider data from API:');
    console.log('  - Provider ID:', apiService.provider?.id);
    console.log('  - Provider User Data:', apiService.provider?.user);
    if (apiService.provider?.user) {
      console.log('    - First Name:', apiService.provider.user.firstName);
      console.log('    - Last Name:', apiService.provider.user.lastName);
      console.log('    - Email:', apiService.provider.user.email);
      console.log('    - Image URL:', apiService.provider.user.imageUrl);
      console.log('    - Location:', (apiService.provider.user as { location?: string }).location);
      console.log('    - Phone:', (apiService.provider.user as { phone?: string }).phone);
    }
    console.log('  - Average Rating:', apiService.provider?.averageRating);
    console.log('  - Total Reviews:', apiService.provider?.totalReviews);
    
    return {
      id: apiService.id,
      title: apiService.title || 'Untitled Service',
      description: apiService.description,
      price: Number(apiService.price),
      currency: apiService.currency,
      images: apiService.images && apiService.images.length > 0 ? apiService.images : ['https://picsum.photos/seed/service/800/400'],
      videoUrl: apiService.videoUrl,
      category: {
        name: apiService.category?.name || 'Service',
        slug: apiService.category?.slug || 'general'
      },
      tags: apiService.tags || [],
      workingTime: apiService.workingTime || [],
      // Location fields
      latitude: apiService.latitude,
      longitude: apiService.longitude,
      address: apiService.address,
      city: apiService.city,
      state: apiService.state,
      country: apiService.country,
      postalCode: apiService.postalCode,
      serviceRadiusKm: apiService.serviceRadiusKm,
      locationLastUpdated: apiService.locationLastUpdated,
      provider: {
        id: apiService.provider?.id,
        name: apiService.provider?.user ? 
          (`${apiService.provider.user.firstName || ''} ${apiService.provider.user.lastName || ''}`.trim() || apiService.provider.user.email || 'Unknown Provider') 
          : 'Unknown Provider',
        email: apiService.provider?.user?.email,
        avatar: 'https://ui-avatars.com/api/?name=Provider&background=6366f1&color=fff&size=60',
        rating: 4.5, // Default rating
        reviews: 23 // Default reviews
      },
      isActive: apiService.isActive,
      createdAt: apiService.createdAt,
      updatedAt: apiService.updatedAt
    };
  };

  // Fetch provider details
  const fetchProviderDetails = async (providerId: string) => {
    try {
      setProviderLoading(true);
      console.log('🔍 Fetching provider details for ID:', providerId);
      const providerData = await userApi.getProviderById(providerId);
      console.log('✅ Provider data received:', providerData);
      console.log('📋 Provider fields breakdown:');
      console.log('  - Provider ID:', providerData?.id);
      console.log('  - User ID:', providerData?.userId);
      console.log('  - Bio:', providerData?.bio);
      console.log('  - Skills:', providerData?.skills);
      console.log('  - Qualifications:', providerData?.qualifications);
      console.log('  - Logo URL:', providerData?.logoUrl);
      console.log('  - Average Rating:', providerData?.averageRating);
      console.log('  - Total Reviews:', providerData?.totalReviews);
      console.log('  - Is Verified:', providerData?.isVerified);
      console.log('User details (via relation):');
      console.log('  - First Name:', providerData?.user?.firstName);
      console.log('  - Last Name:', providerData?.user?.lastName);
      console.log('  - Email:', providerData?.user?.email);
      console.log('  - Image URL:', providerData?.user?.imageUrl);
      console.log('  - Location:', providerData?.user?.location);
      console.log('  - Phone:', providerData?.user?.phone);
      setProvider(providerData);
    } catch (error) {
      console.error('❌ Failed to fetch provider details:', error);
      // Don't show error toast for provider details failure as it's not critical
    } finally {
      setProviderLoading(false);
    }
  };

  // Fetch service reviews
  const fetchServiceReviews = async (serviceId: string) => {
    try {
      setReviewsLoading(true);

      const response = await serviceReviewApi.getServiceReviewsDetailed(serviceId, {
        page: 1,
        limit: 20
      });
      
      if (response.success) {
        setReviews(response.data.reviews);
        setReviewStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch service reviews:', error);
      // Don't show error toast as reviews are not critical for page function
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch current schedules
  const fetchCurrentSchedules = async (serviceId: string) => {
    try {
      setScheduleLoading(true);
      console.log('Fetching schedules for service:', serviceId);
      const response = await fetch(`${import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL_PROD : import.meta.env.VITE_API_BASE_URL}/schedule/current/${serviceId}`);
      console.log('Schedule API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Schedule API response data:', data);
        if (data.success) {
          setCurrentSchedules(data.data);
        }
      } else {
        console.error('Schedule API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching current schedules:', error);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Fetch reviews once the service loads
  useEffect(() => {
    if (service) {
      fetchServiceReviews(service.id);
    }
  }, [service?.id]);

  // Look up any booking this viewer already has for the service.
  useEffect(() => {
    if (!service?.id || !isLoggedIn) {
      setActiveBookingStatus(null);
      setHasPastBooking(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const [active, timeline] = await Promise.all([
          bookingApi.findActive(service.id),
          getBookingTimeline().catch(() => []),
        ]);
        if (!alive) return;
        setActiveBookingStatus(active?.status ?? null);
        setHasPastBooking(
          timeline.some((t) => t.service?.id === service.id && !active)
        );
      } catch {
        if (alive) {
          setActiveBookingStatus(null);
          setHasPastBooking(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [service?.id, isLoggedIn]);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      
      try {
        setLoading(true);
        
        // Try to fetch service directly first
        let response;
        try {
          response = await serviceApi.getServiceById(serviceId);
        } catch (directError) {
          console.log('Failed to get service by ID, trying conversation ID:', directError);
          // If direct service fetch fails, try getting service by conversation ID
          try {
            response = await serviceApi.getServiceByConversationId(serviceId);
          } catch (conversationError) {
            console.error('Failed to get service by conversation ID:', conversationError);
            throw conversationError;
          }
        }
        
        if (response.success) {
          const transformedService = transformApiService(response.data);
          setService(transformedService);
          
          // Fetch provider details if provider ID is available
          if (response.data.provider?.id) {
            await fetchProviderDetails(response.data.provider.id);
          }
          
          // Fetch service reviews
          await fetchServiceReviews(response.data.id);

          // Fetch current schedules
          console.log('About to fetch schedules for service:', response.data.id);
          await fetchCurrentSchedules(response.data.id);
        } else {
          toast.error('Service not found');
          navigate('/services');
        }
      } catch (error) {
        console.error('Failed to fetch service:', error);
        toast.error('Failed to load service details');
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, navigate]);

  const handleBookNow = async (skipExistingCheck = false) => {
    // Check if user is logged in
    if (!isLoggedIn || !user) {
      setShowLoginPrompt(true);
      return;
    }

    // Check if provider ID is available
    if (!service?.provider?.id) {
      toast.error('Provider information not available');
      return;
    }

    // Debug logging
    console.log('=== BOOK NOW DEBUG ===');
    console.log('Current user:', user);
    console.log('Current user ID:', user.id);
    console.log('Service provider ID:', service.provider.id);
    console.log('Service:', service);

    // Validate user IDs
    if (!user.id) {
      toast.error('Invalid user session. Please log in again.');
      return;
    }

    if (!service.provider.id) {
      toast.error('Invalid provider information.');
      return;
    }

    // Get the provider's user ID (not the provider ID)
    let providerUserId: string;
    
    if (provider?.userId) {
      // We have the provider details, use the userId
      providerUserId = provider.userId;
      console.log('Using provider user ID from provider details:', providerUserId);
    } else {
      // We need to fetch the provider to get the userId
      try {
        console.log('Fetching provider details to get user ID...');
        const providerData = await userApi.getProviderById(service.provider.id);
        providerUserId = providerData.userId;
        console.log('Retrieved provider user ID:', providerUserId);
      } catch (error) {
        console.error('Failed to fetch provider details:', error);
        toast.error('Unable to get provider information. Please try again.');
        return;
      }
    }

    try {
      setBookingLoading(true);

      // If a booking for this exact service is still open, ask rather than assume:
      // reopening is right when they forgot it was in flight, but booking the same
      // service a second time is equally legitimate. Keyed on the booking, so a
      // COMPLETED or CANCELLED one never blocks a fresh request.
      // (`skipExistingCheck` is set when they've already chosen "book again".)
      if (!skipExistingCheck) {
        const activeBooking = await bookingApi.findActive(service.id);
        if (activeBooking) {
          setExistingBooking(activeBooking);
          setBookingLoading(false);
          return;
        }
      }

      // Create conversation between user and provider's user ID, including serviceId
      const conversationData = {
        userIds: [user.id, providerUserId],
        title: service.title,
        serviceId: service.id // Pass the serviceId to backend
      };

      console.log('Creating conversation with data:', conversationData);

      const conversation = await messagingApi.createConversation(conversationData);
      
      console.log('Conversation created:', conversation);
      
      // Send initial message (use provider's user ID, not provider ID)
      const initialMessage = `Hi! I'm interested in your service: ${service.title}`;
      console.log('Sending initial message...');
      
      await messagingApi.sendMessage({
        content: initialMessage,
        fromId: user.id,
        toId: providerUserId,
        conversationId: conversation.id
      });

      console.log('Initial message sent successfully');
      
      toast.success('Conversation started! Redirecting to messages...');

      // The booking record is created lazily when the booking panel first opens,
      // so there's nothing to pre-create here.

      // Navigate to the specific conversation
      navigate(`/conversation/${conversation.id}`);
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
      
      // More specific error handling
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('User not found')) {
        console.log('=== USER NOT FOUND ERROR ===');
        console.log('This suggests the user IDs are not valid in the backend database');
        console.log('User ID:', user.id);
        console.log('Provider User ID:', providerUserId);
        debugMessagingState();
        toast.error('User validation failed. Please try logging out and back in.');
      } else if (errorMessage.includes('conversation')) {
        toast.error('Failed to create conversation. Please try again.');
      } else {
        toast.error('Failed to start conversation. Please try again.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleViewProviderProfile = () => {
    if (!isLoggedIn || !user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!provider) return;
    navigate(`/provider/${provider.id}`);
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const nextImage = () => {
    if (service?.images.length > 1) {
      const nextIndex = selectedImage + 1;
      setSelectedImage(nextIndex >= service.images.length ? 0 : nextIndex);
      setAutoSlide(false);
      setTimeout(() => setAutoSlide(true), 10000);
    }
  };

  const prevImage = () => {
    if (service?.images.length > 1) {
      const prevIndex = selectedImage - 1;
      setSelectedImage(prevIndex < 0 ? service.images.length - 1 : prevIndex);
      setAutoSlide(false);
      setTimeout(() => setAutoSlide(true), 10000);
    }
  };

  // Share service handler
  const handleShareService = async () => {
    if (!service) return;

    const shareData = {
      title: service.title,
      text: `Check out this service: ${service.title}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
        alert('Service link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Service link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  };

  // Download QR code handler
  const handleDownloadQR = async () => {
    if (!qrCodeUrl) return;

    try {
      // Use the qrcode library to generate and download
      // Create a temporary div to render the QR code
      const tempDiv = document.createElement('div');
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);

      // Generate QR code using the imported library
      QRCodeLib.toCanvas(qrCodeUrl, {
        width: 256,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error: Error | null | undefined, canvas: HTMLCanvasElement) => {
        if (error) {
          console.error('QR Code generation error:', error);
          document.body.removeChild(tempDiv);
          alert('Unable to generate QR code. Please try again.');
          return;
        }

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${service?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'service'}-qr-code.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          // Clean up
          document.body.removeChild(tempDiv);
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Unable to download QR code. Please try again.');
    }
  };

  const averageRating = reviewStats.averageRating;

  if (loading) {
    return <ServiceDetailSkeleton />;
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
        <div className="flex-1 flex items-center justify-center mt-16">
          <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-500">×</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-500 mb-4">Service not found</h3>
            <Button onClick={() => navigate('/services')} size="lg">
              Back to Services
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Services', href: '/services' },
    { label: service.category?.name || 'Category', href: `/services/${service.category?.slug}` },
    { label: service.title || 'Service' }
  ];

  if (showLoginPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
        <div className="flex-1 flex items-center justify-center mt-16">
          <div className="text-center">
        <p className="text-gray-900 mb-4">Please log in to access your profile.</p>
        <Button
          onClick={() => {
        localStorage.setItem('RedirectAfterLogin', window.location.pathname);
        navigate('/signin');
        setShowLoginPrompt(false);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full"
        >
          Log In
        </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col relative overflow-hidden">
      <main className="flex-1 mt-16 relative z-10">
        <div className="container mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <div className="mb-4 bg-white rounded-xl px-4 py-2.5 shadow-sm">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Full-width Video Section - Outside Grid Container */}
          {service.videoUrl && (
            <ServiceVideoBanner
              videoUrl={service.videoUrl}
              isVideoPlaying={isVideoPlaying}
              onVideoPlay={() => setIsVideoPlaying(true)}
              onVideoEnded={() => setIsVideoPlaying(false)}
              onVideoPause={() => setIsVideoPlaying(false)}
              isWishlisted={isWishlisted}
              onToggleWishlist={toggleWishlist}
            />
          )}

          {/* Main Content Layout - Grid System */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column - Images and Service Info */}
            <div className="lg:col-span-2 space-y-4">
              {/* Hero Banner - image with category badge + title overlay */}
              <ServiceHeroGallery
                images={service.images}
                selectedImage={selectedImage}
                title={service.title}
                description={service.description}
                categoryName={service.category?.name}
                onPrevImage={prevImage}
                onNextImage={nextImage}
              />

              {/* Info cards row: Price / Location / Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-4 h-4 text-orange-700" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="font-semibold text-gray-900">
                        {service.currency} {service.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-orange-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-semibold text-gray-900 truncate">
                        {[service.city, service.state].filter(Boolean).join(', ') || service.address || 'Flexible'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-orange-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Provider</p>
                      <p className="font-semibold text-gray-900 truncate">{service.provider.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-2 flex-wrap px-1">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        "w-4 h-4",
                        index < Math.floor(averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-none text-gray-300"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({reviewStats.totalReviews} reviews)
                </span>
                {service.serviceRadiusKm && (
                  <span className="text-sm text-gray-400">&middot; Travels up to {service.serviceRadiusKm}km</span>
                )}
              </div>

              {/* About This Service */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
                <h2 className="text-base font-semibold text-gray-900 mb-2">About This Service</h2>

                {service.description && (
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {service.description}
                  </p>
                )}

                {service.tags && service.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag, index) => (
                      <Chip key={index} className="h-7 px-3 text-xs pointer-events-none">
                        #{tag}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>

              {/* Location - interactive map when coordinates are available, text fallback otherwise */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  Location
                </h2>
                {typeof service.latitude === 'number' && typeof service.longitude === 'number' ? (
                  <ServiceLocationMap
                    destination={{ latitude: service.latitude, longitude: service.longitude }}
                    destinationLabel={service.title}
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    {[service.address, service.city, service.state, service.country].filter(Boolean).join(', ') || 'Location not specified'}
                  </p>
                )}
              </div>

              {/* Photo Gallery - thumbnails above, large preview below */}
              <ServicePhotoGallery
                images={service.images}
                title={service.title}
                selectedImage={selectedImage}
                onSelectImage={setSelectedImage}
              />

              {/* Schedule + Gallery wrapper (kept inside the same left column) */}
              <div className="space-y-4">
                  {/* Current Schedule Section */}
                  {currentSchedules.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                        Confirmed Schedule
                      </h3>
                      {scheduleLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden md:block bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-3 text-left text-gray-900 font-semibold">Start Time</th>
                                  <th className="px-4 py-3 text-left text-gray-900 font-semibold">End Time</th>
                                  <th className="px-4 py-3 text-left text-gray-900 font-semibold">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentSchedules.map((schedule, index) => (
                                  <tr key={index} className="border-t border-gray-100">
                                    <td className="px-4 py-3 text-gray-600">
                                      {new Date(schedule.startTime).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                      {new Date(schedule.endTime).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Confirmed
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Card View */}
                          <div className="md:hidden space-y-3">
                            {currentSchedules.map((schedule, index) => (
                              <div key={index} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Confirmed
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-medium">Start:</span>
                                    <span className="text-sm text-gray-600 text-right">
                                      {new Date(schedule.startTime).toLocaleDateString()} <br />
                                      <span className="text-xs">{new Date(schedule.startTime).toLocaleTimeString()}</span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-medium">End:</span>
                                    <span className="text-sm text-gray-600 text-right">
                                      {new Date(schedule.endTime).toLocaleDateString()} <br />
                                      <span className="text-xs">{new Date(schedule.endTime).toLocaleTimeString()}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
              </div>
            </div>

            <ServiceBookingSidebar
              service={service}
              provider={provider}
              providerLoading={providerLoading}
              onViewProviderProfile={handleViewProviderProfile}
              onBookNow={() => handleBookNow()}
              bookingLoading={bookingLoading}
              activeBookingStatus={activeBookingStatus}
              hasPastBooking={hasPastBooking}
              qrCodeUrl={qrCodeUrl}
              onDownloadQR={handleDownloadQR}
              onShareService={handleShareService}
            />
          </div>

          <ServiceReviewsCarousel
            reviews={reviews}
            reviewStats={reviewStats}
            averageRating={averageRating}
            reviewsLoading={reviewsLoading}
            currentReviewIndex={currentReviewIndex}
            onReviewIndexChange={setCurrentReviewIndex}
            reviewsScrollRef={reviewsScrollRef}
          />

          {/* Disabled tabs removed */}

        </div>
      </main>

      <ExistingBookingPrompt
        isOpen={!!existingBooking}
        booking={existingBooking}
        starting={bookingLoading}
        onClose={() => setExistingBooking(null)}
        onContinue={() => {
          const id = existingBooking?.conversationId;
          setExistingBooking(null);
          if (id) navigate(`/conversation/${id}`);
        }}
        onStartNew={() => {
          setExistingBooking(null);
          handleBookNow(true);
        }}
      />
    </div>
  );
};

export default ServiceDetailPage;





