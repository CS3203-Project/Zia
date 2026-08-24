import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, Heart, MapPin, Clock, MessageCircle, Phone, Mail, ArrowLeft, Calendar,
  Shield, Award, ChevronLeft, ChevronRight, Send, Bookmark, Eye,
  CheckCircle, Users, ThumbsUp, User, GraduationCap, CreditCard, Github, Linkedin, Twitter, ArrowUpRight, QrCode, Download, Share2,
  DollarSign, Image as ImageIcon
} from 'lucide-react';
import { serviceApi, type ServiceResponse } from '../../api/serviceApi';
import { serviceReviewApi, type ServiceReview, type ReviewStats } from '../../api/serviceReviewApi';
import { userApi, type ProviderProfile } from '../../api/userApi';
import { messagingApi } from '../../api/messagingApi';
import { debugMessagingState } from '../../utils/messagingDebug';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumb from '../../components/services/Breadcrumb';
import { PaymentModal } from '../../components/Payment';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '../../utils/utils';
import { confirmationApi } from '../../api/confirmationApi';
import GlassmorphismProfileCard from '../../components/ui/ProfileCard';
import Button from '@/components/shared/Button';
import Chip from '@/components/shared/Chip';
import QRCode from 'react-qr-code';
import * as QRCodeLib from 'qrcode';

interface DetailedService {
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

interface ChatMessage {
  id: string;
  sender: 'user' | 'provider';
  message: string;
  timestamp: string;
  read: boolean;
}

type TabType = 'overview';

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
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'provider',
      message: 'Hello! I\'d be happy to help you with your project. Feel free to ask any questions!',
      timestamp: '2025-08-21T10:00:00Z',
      read: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  // Reviews state  
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all');
  
  // Reviews carousel state
  const reviewsScrollRef = React.useRef<HTMLDivElement>(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  
  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // QR code state
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Schedule state
  const [currentSchedules, setCurrentSchedules] = useState<{ startTime: string; endTime: string }[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Calculate total media items (video + images)
  const totalMediaItems = service ? (service.videoUrl ? 1 : 0) + service.images.length : 0;

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
      console.log('    - Location:', (apiService.provider.user as any).location);
      console.log('    - Phone:', (apiService.provider.user as any).phone);
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
      const ratingFilter = reviewFilter === 'all' ? undefined : parseInt(reviewFilter);
      
      const response = await serviceReviewApi.getServiceReviewsDetailed(serviceId, {
        page: 1,
        limit: 20,
        rating: ratingFilter
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

  // Refetch reviews when filter changes
  useEffect(() => {
    if (service) {
      fetchServiceReviews(service.id);
    }
  }, [reviewFilter, service?.id]);

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

  const handleContactProvider = () => {
    console.log('Service object:', service); // Debug log
    console.log('Provider ID:', service?.provider?.id); // Debug log
    
    if (service?.provider?.id) {
      console.log('Navigating to provider page with ID:', service.provider.id); // Debug log
      // Navigate to the specific provider page with the provider ID
      navigate(`/provider/${service.provider.id}`);
    } else {
      // When provider ID is not available, show an error
      console.log('No provider ID available'); // Debug log
      toast.error('Provider information not available');
    }
  };

  const handleBookNow = async () => {
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
      
      // Check if conversation already exists (use provider's user ID, not provider ID)
      console.log('Checking for existing conversation between:', user.id, 'and', providerUserId);
      const existingConversation = await messagingApi.findConversationByParticipants(
        user.id, 
        providerUserId
      );

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation);
        toast.success('Opening existing conversation...');
        navigate(`/conversation/${existingConversation.id}`);
        return;
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
      
      // Ensure confirmation record exists for this conversation
      try {
        await confirmationApi.ensure(conversation.id);
      } catch (ensureErr) {
        console.warn('Failed to ensure confirmation record (non-blocking):', ensureErr);
      }
      
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

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  // Payment handlers
  const handlePayNow = () => {
    if (!isLoggedIn || !user) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (!service) {
      toast.error('Service information not available');
      return;
    }
    
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    console.log('Payment completed:', paymentId);
    // The PaymentModal will handle showing the success popup and navigation to profile
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // The PaymentModal will handle showing the error popup
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

  // Chat handlers
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Simulate provider response
      setTimeout(() => {
        const response: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'provider',
          message: 'Thank you for your message! I\'ll get back to you soon with more details.',
          timestamp: new Date().toISOString(),
          read: false
        };
        setChatMessages(prev => [...prev, response]);
      }, 2000);
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
      }, (error: any, canvas: HTMLCanvasElement) => {
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

  // Review helpers
  const filteredReviews = reviewFilter === 'all' 
    ? reviews 
    : reviews.filter(review => review.rating === parseInt(reviewFilter));

  const averageRating = reviewStats.averageRating;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution],
    percentage: reviewStats.totalReviews > 0 
      ? (reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution] / reviewStats.totalReviews) * 100 
      : 0
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col relative overflow-hidden">

        
        <main className="flex-1 mt-16 relative z-10">
          <div className="container mx-auto px-4 py-8">
            {/* Skeleton Breadcrumb */}
            <div className="mb-8 bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 animate-pulse">
              <div className="h-4 bg-gradient-to-r from-black/20 via-dark-muted/30 to-black/20 rounded w-1/3 animate-shimmer"></div>
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column Skeleton */}
              <div className="lg:col-span-2 space-y-4">
                {/* Media Gallery Skeleton */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                  <div className="aspect-[16/9] bg-gradient-to-br from-black/10 via-dark-tertiary/20 to-black/10 animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  </div>
                  <div className="p-4 flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-14 h-14 bg-gradient-to-br from-black/20 to-dark-muted/30 rounded-xl animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Info Skeleton */}
                <div className="py-8 px-6 space-y-4">
                  <div className="h-10 bg-gradient-to-r from-black/20 via-dark-muted/30 to-black/20 rounded w-2/3 animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded-full w-20 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gradient-to-r from-black/15 via-dark-muted/25 to-black/15 rounded w-full animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="h-4 bg-gradient-to-r from-black/15 via-dark-muted/25 to-black/15 rounded w-5/6 animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="h-4 bg-gradient-to-r from-black/15 via-dark-muted/25 to-black/15 rounded w-4/6 animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gradient-to-r from-black/20 to-dark-muted/30 rounded w-1/4 mt-4 animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  </div>
                  
                  {/* Location Card Skeleton */}
                  <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg mt-6">
                    <div className="h-6 bg-gradient-to-r from-black/20 to-dark-muted/30 rounded w-1/3 mb-4 animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-full animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                      <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-3/4 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                      <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-4/6 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Skeleton */}
              <div className="lg:col-span-1">
                <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/20 sticky top-24">
                  {/* Avatar Skeleton */}
                  <div className="flex flex-col items-center mb-8 pb-8 border-b border-white/20">
                    <div className="w-20 h-20 bg-gradient-to-br from-black/20 to-dark-muted/30 rounded-full mb-4 animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="h-6 bg-gradient-to-r from-black/20 to-dark-muted/30 rounded w-32 mb-2 animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-24 animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    
                    {/* Contact Info Skeleton */}
                    <div className="mt-4 w-full space-y-2">
                      <div className="h-10 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded-xl animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                      <div className="h-10 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded-xl animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-4">
                      <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-16 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                      <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-16 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>

                  {/* Price Skeleton */}
                  <div className="text-center mb-6 space-y-3">
                    <div className="h-10 bg-gradient-to-r from-black/20 to-dark-muted/30 rounded w-32 mx-auto animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-24 mx-auto animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="h-8 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded-full w-32 mx-auto animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                  </div>

                  {/* Buttons Skeleton */}
                  <div className="space-y-3 mb-6">
                    <div className="h-14 bg-gradient-to-r from-black/30 to-dark-secondary/40 rounded-full animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="h-14 bg-gradient-to-r from-black/20 to-dark-muted/30 rounded-full animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                  </div>

                  {/* Working Hours Skeleton */}
                  <div className="pt-6 border-t border-white/20 space-y-3">
                    <div className="h-5 bg-gradient-to-r from-black/20 to-dark-muted/30 rounded w-32 animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded-xl animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Skeleton */}
            <div className="mb-6 mt-6">
              <div className="flex items-center justify-between mb-8">
                <div className="h-8 bg-gradient-to-r from-black/20 to-dark-muted/30 rounded w-48 animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                </div>
                <div className="h-10 bg-gradient-to-r from-black/20 to-dark-muted/30 rounded-full w-32 animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                </div>
              </div>
              
              <div className="flex gap-6 overflow-hidden pb-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-shrink-0 w-[90%] sm:w-[45%] lg:w-[32%]">
                    <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-xl">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-black/20 to-dark-muted/30 rounded-full animate-pulse relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-gradient-to-r from-black/20 to-dark-muted/30 rounded w-3/4 animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                          </div>
                          <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-1/2 animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <div key={j} className="w-5 h-5 bg-gradient-to-br from-black/20 to-dark-muted/30 rounded animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-full animate-pulse relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                        </div>
                        <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-5/6 animate-pulse relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                        </div>
                        <div className="h-4 bg-gradient-to-r from-black/15 to-dark-muted/25 rounded w-4/6 animate-pulse relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
        <div className="flex-1 flex items-center justify-center mt-16">
          <div className="text-center bg-dark-card rounded-2xl p-8 shadow-lg border border-dark-primary">
            <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-500">×</span>
            </div>
            <h3 className="text-xl font-semibold text-dark-secondary mb-4">Service not found</h3>
            <button 
              onClick={() => navigate('/services')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Back to Services
            </button>
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
            <div className="-mx-4 mb-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 group">
              <div className="relative bg-gradient-to-br from-white via-dark-secondary to-white">
                <video
                  autoPlay
                  muted
                  playsInline
                  loop
                  className="w-full max-h-[60vh] object-cover"
                  onPlay={() => setIsVideoPlaying(true)}
                  onEnded={() => setIsVideoPlaying(false)}
                  onPause={() => setIsVideoPlaying(false)}
                >
                  <source src={service.videoUrl} type="video/mp4" />
                  <source src={service.videoUrl} type="video/webm" />
                </video>

                {/* Dark overlay for video */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40"></div>

                {/* Video indicator badge */}
                <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20">
                  <div className="flex items-center text-white text-sm font-medium">
                    <Eye className="w-4 h-4 mr-2" />
                    {isVideoPlaying ? 'Playing' : 'Demo Video'}
                  </div>
                </div>

                {/* Floating Action Buttons with Glass Morphism */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={toggleWishlist}
                    className={cn(
                      "p-3 rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-110 shadow-lg",
                      isWishlisted
                        ? 'bg-orange-500 text-white border-orange-500/10'
                        : 'bg-white/70 text-dark-primary border-white/5 hover:bg-dark-card'
                    )}
                    title="Add to wishlist"
                  >
                    <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                  </button>
                  <button
                    className="p-3 rounded-full bg-white/70 backdrop-blur-md border border-white/5 text-dark-primary hover:bg-dark-card transition-all duration-300 hover:scale-110 shadow-lg"
                    title="Bookmark service"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Layout - Grid System */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column - Images and Service Info */}
            <div className="lg:col-span-2 space-y-4">
              {/* Hero Banner - image with category badge + title overlay */}
              {service.images.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden shadow-md group">
                  <div className="h-44 sm:h-56 md:h-64 relative bg-gray-100">
                    <img
                      src={service.images[selectedImage]}
                      alt={service.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                  </div>

                  {/* Category badge */}
                  {service.category?.name && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                        {service.category.name}
                      </span>
                    </div>
                  )}

                  {/* Image counter */}
                  {service.images.length > 1 && (
                    <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-white/90 backdrop-blur-md rounded-full px-2.5 py-1 shadow-sm">
                      <Eye className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-700 text-xs font-medium">
                        {selectedImage + 1}/{service.images.length}
                      </span>
                    </div>
                  )}

                  {/* Title overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 drop-shadow-md line-clamp-1">
                      {service.title}
                    </h1>
                    {service.description && (
                      <p className="text-white/90 text-xs sm:text-sm max-w-2xl line-clamp-1">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Navigation arrows */}
                  {service.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-md rounded-full text-gray-700 hover:bg-white transition-all duration-300 hover:scale-110 shadow-sm"
                        title="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-md rounded-full text-gray-700 hover:bg-white transition-all duration-300 hover:scale-110 shadow-sm"
                        title="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

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
                <div className="bg-amber-50 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-semibold text-gray-900 truncate">
                        {[service.city, service.state].filter(Boolean).join(', ') || service.address || 'Flexible'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-2xl p-4">
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

              {/* Photo Gallery - thumbnails above, large preview below */}
              {service.images.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                    Photos
                    <span className="text-gray-400 font-normal text-sm">({service.images.length})</span>
                  </h2>

                  {service.images.length > 1 && (
                    <div className="flex gap-2.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
                      {service.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={cn(
                            "flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200",
                            selectedImage === index
                              ? 'border-orange-500 ring-2 ring-orange-200'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          )}
                          title={`View photo ${index + 1}`}
                        >
                          <img src={image} alt={`${service.title} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="w-full h-72 sm:h-96 md:h-[28rem] rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src={service.images[selectedImage]}
                      alt={`${service.title} - photo ${selectedImage + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

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

            {/* Right Column - Unified Booking & Provider Card */}
            <div className="lg:col-span-1 space-y-6 pb-10">
              {/* Unified Glass Morphism Card */}
              <div className="relative">
                <div 
                  className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/20 sticky top-24"
                  style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}
                >
                  {/* Provider Profile Section */}
                  {provider && (
                    <div className="mb-8 pb-8 border-b border-white/20">
                      <div className="flex flex-col items-center">
                        {/* Avatar */}
                        <div className="w-20 h-20 mb-4 rounded-full p-1 border-2 border-white/10 relative">
                          <img 
                            src={provider?.logoUrl || provider?.user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider?.user ? `${provider.user.firstName || ''} ${provider.user.lastName || ''}`.trim() || provider.user.email || 'User' : 'Provider')}&background=000000&color=ffffff&size=96`}
                            alt="Provider"
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; 
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent('P')}&background=000000&color=ffffff&size=96`;
                            }}
                          />
                          {provider?.isVerified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            </div>
                          )}
                        </div>

                        {/* Name and Title */}
                        <h3 className="text-xl font-bold text-dark-primary text-center">
                          {provider?.user ? `${provider.user.firstName || ''} ${provider.user.lastName || ''}`.trim() || provider.user.email || 'Provider' : 'Provider'}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-dark-secondary">
                          {provider?.isVerified ? 'Verified Provider' : 'Service Provider'}
                        </p>

                        {/* Contact Information */}
                        {(() => {
                          console.log('Provider phone:', provider?.user?.phone);
                          return (provider?.user?.email || provider?.user?.phone) && (
                            <div className="mt-4 w-full space-y-2">
                              {provider?.user?.email && (
                                <div className="flex flex-col items-center justify-center gap-1 text-sm bg-white/50 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/20">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-dark-primary" />
                                    <span className="text-dark-secondary truncate">{provider.user.email}</span>
                                  </div>
                                  {provider?.user?.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-dark-primary" />
                                      <span className="text-dark-secondary">{provider.user.phone}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Stats */}
                        {((provider?.averageRating !== undefined && provider?.averageRating !== null) || (provider?.services?.length !== undefined && provider?.services?.length !== null)) && (
                          <div className="flex items-center gap-4 mt-4">
                            {provider?.averageRating !== undefined && provider?.averageRating !== null && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-semibold text-dark-primary">{provider.averageRating.toFixed(1)}</span>
                                {provider?.totalReviews !== undefined && provider?.totalReviews !== null && (
                                  <span className="text-xs text-dark-muted">({provider.totalReviews})</span>
                                )}
                              </div>
                            )}
                            
                            {provider?.services?.length !== undefined && provider?.services?.length !== null && (
                              <div className="flex items-center gap-1 text-sm text-dark-secondary">
                                <span className="font-semibold text-dark-primary">{provider.services.length}</span>
                                <span className="text-xs">Service{provider.services.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* View Profile Button */}
                        <button
                          onClick={() => {
                            if (!isLoggedIn || !user) {
                              setShowLoginPrompt(true);
                              return;
                            }
                            navigate(`/provider/${provider.id}`);
                          }}
                          className="mt-4 text-sm text-dark-primary hover:underline flex items-center gap-1"
                        >
                          View Full Profile
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Price Section */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-dark-primary mb-2">
                      {service.currency} {service.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-dark-muted mb-4">Starting price</div>
                    <div className="flex items-center justify-center text-dark-primary bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20 shadow-lg">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Available now</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 mb-6">
                    <button
                      onClick={handlePayNow}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 px-6 rounded-full font-bold hover:scale-105 hover:-translate-y-0.5 active:scale-100 transition-all duration-300 shadow-xl hover:shadow-2xl border border-orange-500/20 backdrop-blur-sm flex items-center justify-center"
                      style={{ boxShadow: '0 4px 24px rgba(249,115,22,0.3)' }}
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Pay Now
                    </button>
                    
                    <button
                      onClick={handleBookNow}
                      disabled={bookingLoading}
                      className="w-full bg-white text-dark-primary py-4 px-6 rounded-full font-bold hover:bg-orange-50 hover:border-orange-300 hover:scale-105 hover:-translate-y-0.5 active:scale-100 transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {bookingLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span>Creating conversation</span>
                        </div>
                      ) : (
                        'Book Now'
                      )}
                    </button>
                    <button
                      onClick={handleBookNow}
                      disabled={bookingLoading}
                      className="w-full bg-white text-dark-primary py-4 px-6 rounded-full font-bold hover:bg-orange-50 hover:border-orange-300 hover:scale-105 hover:-translate-y-0.5 active:scale-100 transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {bookingLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span>Creating conversation</span>
                        </div>
                      ) : (
                        'Message Provider'
                      )}
                    </button>
                  </div>

                  {/* QR Code Section */}
                  <div className="pt-6 border-t border-white/20">
                    <h4 className="text-sm font-semibold text-dark-primary mb-4 flex items-center">
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Code
                    </h4>
                    <div className="flex flex-col items-center space-y-3">
                      {/* QR Code */}
                      <div className="bg-white/60 backdrop-blur-xl p-4 rounded-xl border border-white/20 shadow-sm">
                        <div className="w-24 h-24 flex items-center justify-center">
                          {qrCodeUrl ? (
                            <QRCode
                              value={qrCodeUrl}
                              size={96}
                              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                              viewBox={`0 0 256 256`}
                              fgColor="currentColor"
                              bgColor="transparent"
                            />
                          ) : (
                            <div className="w-full h-full bg-black/20 rounded animate-pulse"></div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleDownloadQR}
                          className="flex items-center space-x-1 bg-white/60 backdrop-blur-xl hover:bg-white/80 text-dark-primary border border-white/20 rounded-lg px-3 py-2 shadow-sm transition-all duration-200 text-xs"
                          title="Download QR Code"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={handleShareService}
                          className="flex items-center space-x-1 bg-white/60 backdrop-blur-xl hover:bg-white/80 text-dark-primary border border-white/20 rounded-lg px-3 py-2 shadow-sm transition-all duration-200 text-xs"
                          title="Share Service"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Working Hours Section */}
                  {service.workingTime && service.workingTime.length > 0 && (
                    <div >
                      <h4 className="text-sm font-semibold text-dark-primary mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Working Hours
                      </h4>
                      <div className="space-y-2">
                        {service.workingTime.map((time, index) => (
                          <div 
                            key={index}
                            className="flex items-center bg-white/60 backdrop-blur-xl rounded-xl p-3 border border-white/20 shadow-sm"
                          >
                            <Calendar className="w-3.5 h-3.5 text-dark-primary/60 mr-2" />
                            <span className="text-sm text-dark-primary font-medium">{time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Enhanced Glassmorphism glow effect */}
                <div className="absolute inset-0 rounded-3xl -z-10 transition-all duration-500 ease-out blur-3xl opacity-30 bg-gradient-to-br from-orange-300/40 via-amber-200/20 to-orange-300/40" />
              </div>
            </div>
          </div>

          {/* Reviews Carousel Section */}
          {reviews.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-dark-primary">
                  Customer Reviews
                </h2>
                <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 shadow-lg">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-semibold text-dark-primary">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-dark-secondary">
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
                    setCurrentReviewIndex(newIndex);
                  }}
                >
                  {reviews.map((review, index) => (
                    <div 
                      key={review.id}
                      className="flex-shrink-0 w-[90%] sm:w-[45%] lg:w-[32%] snap-start"
                    >
                      <div className={cn(
                        "bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 h-full transition-all duration-500",
                        index === currentReviewIndex 
                          ? "shadow-2xl scale-105 border-white/30" 
                          : "shadow-xl hover:shadow-2xl"
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
                                  <span className="text-2xl text-dark-primary font-bold">
                                    {review.clientName?.[0]?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Verified badge */}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-dark-primary mb-1">
                              {review.clientName || 'Anonymous'}
                            </h4>
                            <p className="text-sm text-dark-muted">
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
                                  : "fill-none text-dark-muted"
                              )}
                            />
                          ))}
                          <span className="ml-2 text-sm font-semibold text-dark-primary">
                            {review.rating}.0
                          </span>
                        </div>

                        {/* Review Comment */}
                        {review.comment && (
                          <div className="relative">
                            <p className="text-base text-dark-secondary leading-relaxed line-clamp-5 italic">
                              "{review.comment}"
                            </p>
                          </div>
                        )}

                        {/* Helpful indicator */}
                        {review.helpful > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <span className="text-sm text-dark-secondary flex items-center gap-2">
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
                          setCurrentReviewIndex(index);
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
                            : "w-2 h-2 bg-dark-tertiary hover:bg-gray-400"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Reviews Message */}
          {reviews.length === 0 && !reviewsLoading && (
            <div className="mb-6 text-center py-12 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg">
              <Star className="w-16 h-16 mx-auto mb-4 text-dark-muted" />
              <p className="text-dark-secondary text-lg">
                No reviews yet. Be the first to review this service!
              </p>
            </div>
          )}

          {/* Disabled tabs removed */}

        </div>
      </main>

      <Toaster position="bottom-right" />
      
      {/* Payment Modal */}
      {service && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          serviceId={service.id}
          serviceName={service.title}
          servicePrice={typeof service.price === 'string' ? parseFloat(service.price) : service.price}
          serviceCurrency={service.currency}
          serviceImage={service.images?.[0]}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
};

export default ServiceDetailPage;





