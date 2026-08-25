import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import { userApi } from '../../api/userApi';
import { serviceApi, type ServiceResponse } from '../../api/serviceApi';
import { paymentApi, type Payment, type ProviderEarnings } from '../../api/paymentApi';
import type { UserProfile, ProviderProfile, Company } from '../../api/userApi';
import EditProviderModal from '../../components/Profile/EditProviderModal';
import EditProfileModal from '../../components/Profile/EditProfileModal';
import CompanyModal from '../../components/Profile/CompanyModal';
import { uploadMultipleImages } from '../../utils/imageUpload';
import { serviceReviewApi } from '../../api/serviceReviewApi';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import Orb from '../../components/shared/Orb';
import ProfileLoadingSkeleton from '../../components/Profile/sections/ProfileLoadingSkeleton';
import ProfileHeader from '../../components/Profile/sections/ProfileHeader';
import BasicInformationCard from '../../components/Profile/sections/BasicInformationCard';
import MyServicesCard from '../../components/Profile/sections/MyServicesCard';
import BecomeProviderCard from '../../components/Profile/sections/BecomeProviderCard';
import UpdateServiceModal from '../../components/Profile/sections/UpdateServiceModal';
import ConfirmDeleteModal from '../../components/Profile/sections/ConfirmDeleteModal';
import ProviderStatsCards from '../../components/Profile/sections/ProviderStatsCards';
import PerformanceTrendsChart from '../../components/Profile/sections/PerformanceTrendsChart';
import ProviderAboutSection from '../../components/Profile/sections/ProviderAboutSection';
import ReviewsSection, { type CustomerReview, type ServiceReview } from '../../components/Profile/sections/ReviewsSection';
import RecentReviewsCard from '../../components/Profile/sections/RecentReviewsCard';
import UnverifiedProviderNotice from '../../components/Profile/sections/UnverifiedProviderNotice';
import CompaniesCard from '../../components/Profile/sections/CompaniesCard';
import ProviderPaymentEarningsCard from '../../components/Profile/sections/ProviderPaymentEarningsCard';
import CustomerPaymentHistoryCard from '../../components/Profile/sections/CustomerPaymentHistoryCard';

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, isLoading: authLoading, updateUser } = useAuth();
  const [localUser] = useState<UserProfile | null>(null);
  const [showEditProviderModal, setShowEditProviderModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showDeleteCompanyConfirmation, setShowDeleteCompanyConfirmation] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ServiceResponse[]>([]);
  
  // Payment related state
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [earnings, setEarnings] = useState<ProviderEarnings | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);
  const [totalPaymentPages, setTotalPaymentPages] = useState(1);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  // Reviews related state
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);
  const [serviceReviews, setServiceReviews] = useState<ServiceReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedReviewType, setSelectedReviewType] = useState<'customer' | 'service'>('customer');
  
  // Use AuthContext user data and sync with local state for provider-specific data
  const user = authUser || localUser;
  const loading = authLoading;

  const [servicesLoading, setServicesLoading] = useState(false);
  const [showUpdateServiceModal, setShowUpdateServiceModal] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedService, setSelectedService] = useState<{
    id: string;
    title?: string;
    description?: string;
    price: number;
    currency: string;
    tags?: string[];
    images?: string[];
    isActive: boolean;
    workingTime?: string[];
  } | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    title: '',
    description: '',
    price: 0,
    currency: 'LKR',
    tags: [] as string[],
    images: [] as string[],
    isActive: true,
    workingTime: [] as string[],
    // Location fields
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    serviceRadiusKm: 10
  });


  const fetchProviderServices = useCallback(async (providerId: string) => {
    try {
      console.log('Fetching services for provider ID:', providerId);
      setServicesLoading(true);
      const response = await serviceApi.getServices({ providerId });
      console.log('Services API response:', response);
      if (response.success) {
        console.log('Services data:', response.data);
        setServices(response.data);
      } else {
        console.log('Services API returned unsuccessful response:', response);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error('Failed to load services');
    } finally {
      setServicesLoading(false);
    }
  }, []);

  // Optimized fetch provider data (only when user changes and is a provider)
  const fetchProviderData = useCallback(async () => {
    if (!user || user.role !== 'PROVIDER') return;
    
    try {
      const providerData = await userApi.getProviderProfile();
      console.log('Provider profile data:', providerData);
      setProviderProfile(providerData);
      
      // Fetch services for this provider
      if (providerData.id) {
        console.log('Fetching services for provider ID:', providerData.id);
        await fetchProviderServices(providerData.id);
      } else {
        console.log('Provider data does not have an ID:', providerData);
      }
    } catch (error) {
      console.error('Failed to fetch provider profile:', error);
    }
  }, [user, fetchProviderServices]);

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async (page: number = 1) => {
    if (!user) return;
    
    console.log('fetchPaymentHistory called for user:', user.email, 'role:', user.role);
    
    try {
      setPaymentLoading(true);
      console.log('Calling paymentApi.getPaymentHistory...');
      const response = await paymentApi.getPaymentHistory(page, 10);
      console.log('Payment history response:', response);
      console.log('Response.payments length:', response.payments?.length || 0);
      setPaymentHistory(response.payments || []);
      setTotalPaymentPages(response.pagination?.pages || 1);
      setPaymentPage(response.pagination?.page || 1);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      // Don't show toast error for payment history as it's not critical
      // toast.error('Failed to load payment history');
      setPaymentHistory([]);
    } finally {
      setPaymentLoading(false);
    }
  }, [user]);

  // Fetch provider earnings
  const fetchProviderEarnings = useCallback(async () => {
    if (!user || user.role !== 'PROVIDER') return;

    try {
      const earningsData = await paymentApi.getProviderEarnings();
      console.log('Earnings data received:', earningsData);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
      // Don't show toast error for earnings as it's not critical
      // toast.error('Failed to load earnings data');
    }
  }, [user]);

  // Fetch customer reviews (when user is acting as customer)
  const fetchCustomerReviews = useCallback(async () => {
    if (!user) return;

    try {
      setReviewsLoading(true);
      const response = await userApi.getCustomerReviewsReceived(user.id);
      setCustomerReviews(response.reviews || []);
    } catch (error) {
      console.error('Failed to fetch customer reviews:', error);
      setCustomerReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [user]);

  // Fetch service reviews (when user has provider profile data)
  const fetchServiceReviews = useCallback(async () => {
    if (!user || !providerProfile?.id) return;

    try {
      setReviewsLoading(true);
      // Use serviceReviewApi similar to Provider page
      const response = await serviceReviewApi.getProviderServiceReviews(providerProfile.id);
      if (response.success) {
        setServiceReviews(response.data.reviews || []);
      } else {
        setServiceReviews([]);
      }
    } catch (error) {
      console.error('Failed to fetch service reviews:', error);
      setServiceReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [user, providerProfile?.id]);

  // Replace the old fetchProfile useEffect with optimized version
  useEffect(() => {
    if (!authLoading && user) {
      fetchProviderData();
      // Fetch payment data for all users
      if (user.role === 'PROVIDER') {
        // Fetch earnings for providers
        fetchProviderEarnings().catch(err => console.log('Earnings fetch failed:', err));
      }
      // Fetch reviews for all users - service reviews loaded separately when provider profile is available
      fetchCustomerReviews().catch(err => console.log('Customer reviews fetch failed:', err));
      // Fetch payment history for all users (providers and customers)
      fetchPaymentHistory().catch(err => console.log('Payment history fetch failed:', err));
    }
  }, [authLoading, user, fetchProviderData, fetchProviderEarnings, fetchPaymentHistory, fetchCustomerReviews]);

  // Separate effect to fetch service reviews when provider profile is loaded
  useEffect(() => {
    if (providerProfile?.id && user) {
      fetchServiceReviews().catch(err => console.log('Service reviews fetch failed:', err));
    }
  }, [providerProfile?.id, user, fetchServiceReviews]);

  const refreshServices = useCallback(() => {
    if (providerProfile?.id) {
      fetchProviderServices(providerProfile.id);
    }
  }, [providerProfile?.id, fetchProviderServices]);

  // Listen for window focus to refresh services when returning from create service page
  useEffect(() => {
    const handleFocus = () => {
      if (providerProfile?.id) {
        refreshServices();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [providerProfile?.id, refreshServices]);

  const handleUpdateProfile = (updatedUser: Partial<UserProfile>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      updateUser(newUser);
    }
  };

  const handleBecomeProvider = () => {
    navigate('/become-provider');
  };

  const handleProviderUpdated = (updatedProvider: ProviderProfile) => {
    setProviderProfile(updatedProvider);
    // Also update user data if needed
    if (user && updatedProvider.user) {
      const newUser = { ...user, role: updatedProvider.user.role };
      updateUser(newUser);
    }
    // Refresh services after provider update
    if (updatedProvider.id) {
      fetchProviderServices(updatedProvider.id);
    }
  };

  const handleDeleteProvider = async () => {
    try {
      await userApi.deleteProvider();
      toast.success('Provider profile deleted successfully!');
      setShowDeleteConfirmation(false);
      // Update auth context user data
      const updatedUser = await userApi.getProfile();
      updateUser(updatedUser);
      setProviderProfile(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete provider profile');
    }
  };

  const handleCompanySuccess = (company: Company) => {
    // Update the provider profile with the new/updated company
    if (providerProfile) {
      if (selectedCompany) {
        // Update existing company
        setProviderProfile({
          ...providerProfile,
          companies: providerProfile.companies.map(c => 
            c.id === company.id ? company : c
          )
        });
      } else {
        // Add new company
        setProviderProfile({
          ...providerProfile,
          companies: [...providerProfile.companies, company]
        });
      }
    }
    setSelectedCompany(null);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    try {
      await userApi.deleteCompany(companyToDelete);
      toast.success('Company deleted successfully!');
      
      // Update the provider profile
      if (providerProfile) {
        setProviderProfile({
          ...providerProfile,
          companies: providerProfile.companies.filter(c => c.id !== companyToDelete)
        });
      }
      
      setShowDeleteCompanyConfirmation(false);
      setCompanyToDelete(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete company');
    }
  };

  const handleDeleteCompanyClick = (companyId: string) => {
    setCompanyToDelete(companyId);
    setShowDeleteCompanyConfirmation(true);
  };

  const handleEditService = (service: {
    id: string;
    title?: string;
    description?: string;
    price: number;
    currency: string;
    tags?: string[];
    images?: string[];
    isActive: boolean;
    workingTime?: string[];
    // Location fields
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    serviceRadiusKm?: number;
  }) => {
    setSelectedService(service);
    setServiceFormData({
      title: service.title || '',
      description: service.description || '',
      price: service.price || 0,
      currency: service.currency || 'LKR',
      tags: service.tags || [],
      images: service.images || [],
      isActive: service.isActive ?? true,
      workingTime: service.workingTime || [],
      // Location fields
      latitude: service.latitude,
      longitude: service.longitude,
      address: service.address || '',
      city: service.city || '',
      state: service.state || '',
      country: service.country || '',
      postalCode: service.postalCode || '',
      serviceRadiusKm: service.serviceRadiusKm || 10
    });
    setShowUpdateServiceModal(true);
  };

  const handleUpdateService = async () => {
    if (!selectedService) return;

    if (uploadingImages) {
      toast.error('Please wait for image uploads to complete');
      return;
    }

    try {
      await serviceApi.updateService(selectedService.id, serviceFormData);
      toast.success('Service updated successfully!');
      
      // Refetch services directly instead of full profile
      if (providerProfile?.id) {
        await fetchProviderServices(providerProfile.id);
      }
      
      // Also refetch services if we have a provider profile
      if (providerProfile?.id) {
        await fetchProviderServices(providerProfile.id);
      }
      
      setShowUpdateServiceModal(false);
      setSelectedService(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update service');
    }
  };

  const handleServiceFormChange = (field: string, value: string | number | boolean | string[]) => {
    setServiceFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = async (location: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    serviceRadiusKm?: number;
  } | null) => {
    if (!location) {
      // Reset location fields when location is cleared
      setServiceFormData(prev => ({
        ...prev,
        latitude: undefined,
        longitude: undefined,
        address: '',
        city: undefined,
        state: undefined,
        country: undefined,
        postalCode: undefined,
        serviceRadiusKm: 10
      }));
      return;
    }

    // If we have latitude and longitude but no extended geolocation data,
    // perform reverse geocoding to get address components
    let updatedLocation = { ...location };
    if (location.latitude && location.longitude && !location.city && !location.country) {
      try {
        const { hybridSearchApi } = await import('../../api/hybridSearchApi');
        const response = await hybridSearchApi.reverseGeocode(location.latitude, location.longitude);
        if (response.success && response.data && response.data.city && response.data.country) {
          updatedLocation = {
            ...location,
            address: location.address || response.data.address,
            city: response.data.city,
            state: response.data.state,
            country: response.data.country,
            postalCode: response.data.postalCode
          };
        }
      } catch (error) {
        console.warn('Failed to reverse geocode location:', error);
        // Continue with original location data if reverse geocoding fails
      }
    }

    setServiceFormData(prev => ({
      ...prev,
      latitude: updatedLocation.latitude || prev.latitude,
      longitude: updatedLocation.longitude || prev.longitude,
      address: updatedLocation.address || '',
      city: updatedLocation.city,
      state: updatedLocation.state,
      country: updatedLocation.country,
      postalCode: updatedLocation.postalCode,
      serviceRadiusKm: updatedLocation.serviceRadiusKm || prev.serviceRadiusKm || 10
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const imageUrls = await uploadMultipleImages(files);
      setServiceFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
      toast.success(`${files.length} image(s) uploaded successfully!`);
    } catch (error) {
      toast.error('Failed to upload images. Please try again.');
      console.error('Image upload error:', error);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setServiceFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  if (loading) {
    return <ProfileLoadingSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
        <div className="flex-1 flex items-center justify-center mt-16">
          <div className="text-center">
        <p className="text-gray-900 mb-4">Please log in to access your profile.</p>
        <Button
          onClick={() => {
        localStorage.setItem('RedirectAfterLogin', window.location.pathname);
        navigate('/signin');
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
    <div className="relative min-h-screen bg-gradient-to-b from-orange-50 to-white overflow-hidden">
      {/* Background accent - matches homepage */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-72 h-72 opacity-10 blur-3xl">
          <Orb hue={0} hoverIntensity={0.15} rotateOnHover={true} />
        </div>
      </div>

      {/* Content Overlay - Glass Morphism */}
      <div className="relative z-10 flex flex-col min-h-screen" style={{ paddingLeft: '10px', paddingRight: '10px' }}>      
        <main className="flex-1 mx-[30px] px-4 sm:px-6 lg:px-8 mt-20 mb-8">
        {/* Profile Header - Glass Style */}
        <ProfileHeader
          user={user}
          providerProfile={providerProfile}
          onEditProfile={() => setShowEditProfileModal(true)}
          onEditProvider={() => setShowEditProviderModal(true)}
          onDeleteProviderClick={() => setShowDeleteConfirmation(true)}
        />

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Information */}
            <BasicInformationCard user={user} />

            {/* My Services Section - Moved to Left Column */}
            <MyServicesCard
              providerProfile={providerProfile}
              servicesLoading={servicesLoading}
              services={services}
              onEditService={handleEditService}
              onNavigateToService={(serviceId) => navigate(`/service/${serviceId}`)}
              onCreateService={() => navigate('/create-service')}
            />
          </div>

          {/* Right Column - Provider-specific content */}
          <div className="lg:col-span-2">
            {user.role === 'PROVIDER' && providerProfile ? (
              // Check if provider is verified
              providerProfile.isVerified === false ? (
                /* Unverified Provider */
                <UnverifiedProviderNotice
                  providerProfile={providerProfile}
                  onEditProvider={() => setShowEditProviderModal(true)}
                  onCancelApplication={() => setShowDeleteConfirmation(true)}
                />
              ) : (
                /* Verified Provider - existing content */
              <div className="space-y-6">
                {/* Provider Stats - Glass Morphism */}
                <ProviderStatsCards providerProfile={providerProfile} services={services} />

                {/* Performance Trends Chart - Full Width */}
                <PerformanceTrendsChart services={services} />

                {/* Bio, Skills & Qualifications - Glass Morphism */}
                <ProviderAboutSection
                  bio={providerProfile.bio}
                  skills={providerProfile.skills}
                  qualifications={providerProfile.qualifications}
                />

                {/* Reviews Section with Dropdown for Providers */}
                <ReviewsSection
                  customerReviews={customerReviews}
                  serviceReviews={serviceReviews}
                  reviewsLoading={reviewsLoading}
                  selectedReviewType={selectedReviewType}
                  onReviewTypeChange={setSelectedReviewType}
                  showServiceOption={serviceReviews.length > 0}
                />

                {/* Companies */}
                <CompaniesCard
                  companies={providerProfile.companies}
                  onAddCompany={() => {
                    setSelectedCompany(null);
                    setShowCompanyModal(true);
                  }}
                  onEditCompany={handleEditCompany}
                  onDeleteCompanyClick={handleDeleteCompanyClick}
                />

                {/* Payment History & Earnings */}
                <ProviderPaymentEarningsCard
                  earnings={earnings}
                  paymentHistory={paymentHistory}
                  paymentLoading={paymentLoading}
                  showPaymentHistory={showPaymentHistory}
                  onTogglePaymentHistory={() => setShowPaymentHistory(!showPaymentHistory)}
                  paymentPage={paymentPage}
                  totalPaymentPages={totalPaymentPages}
                  onPageChange={fetchPaymentHistory}
                />

                {/* Recent Reviews */}
                <RecentReviewsCard
                  reviews={providerProfile.reviews}
                  averageRating={providerProfile.averageRating}
                  totalReviews={providerProfile.totalReviews}
                />
              </div>
              )
            ) : user.role === 'PROVIDER' && !providerProfile ? (
              /* Loading provider data */
              <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-800 p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-400">Loading provider profile...</p>
              </div>
            ) : (
              /* USER role content */
              <div className="space-y-6">
                {/* Welcome Section */}
                <BecomeProviderCard onBecomeProvider={handleBecomeProvider} />

                {/* Reviews Section with Dropdown */}
                {(customerReviews.length > 0 || (user.role === 'PROVIDER' && serviceReviews.length > 0)) && (
                  <ReviewsSection
                    customerReviews={customerReviews}
                    serviceReviews={serviceReviews}
                    reviewsLoading={reviewsLoading}
                    selectedReviewType={selectedReviewType}
                    onReviewTypeChange={setSelectedReviewType}
                    showServiceOption={user.role === 'PROVIDER' && serviceReviews.length > 0}
                  />
                )}

                {/* Customer Payment History */}
                <CustomerPaymentHistoryCard
                  paymentHistory={paymentHistory}
                  paymentLoading={paymentLoading}
                  showPaymentHistory={showPaymentHistory}
                  onTogglePaymentHistory={() => setShowPaymentHistory(!showPaymentHistory)}
                  paymentPage={paymentPage}
                  totalPaymentPages={totalPaymentPages}
                  onPageChange={fetchPaymentHistory}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {/* Update Service Modal */}
      <UpdateServiceModal
        isOpen={showUpdateServiceModal && !!selectedService}
        serviceFormData={serviceFormData}
        uploadingImages={uploadingImages}
        onFormChange={handleServiceFormChange}
        onLocationChange={handleLocationChange}
        onImageUpload={handleImageUpload}
        onRemoveImage={removeImage}
        onClose={() => {
          setShowUpdateServiceModal(false);
          setSelectedService(null);
        }}
        onSubmit={handleUpdateService}
      />

      <EditProfileModal 
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onSuccess={handleUpdateProfile}
        user={user}
      />

      {providerProfile && (
        <EditProviderModal 
          isOpen={showEditProviderModal}
          onClose={() => setShowEditProviderModal(false)}
          onSuccess={handleProviderUpdated}
          provider={providerProfile}
        />
      )}

      {/* Company Modal */}
      <CompanyModal 
        isOpen={showCompanyModal}
        onClose={() => {
          setShowCompanyModal(false);
          setSelectedCompany(null);
        }}
        onSuccess={handleCompanySuccess}
        company={selectedCompany}
      />

      {/* Delete Company Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteCompanyConfirmation}
        title="Delete Company"
        message="Are you sure you want to delete this company? This action cannot be undone."
        confirmLabel="Delete Company"
        onCancel={() => {
          setShowDeleteCompanyConfirmation(false);
          setCompanyToDelete(null);
        }}
        onConfirm={handleDeleteCompany}
      />

      {/* Delete Provider Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete Provider Profile"
        message="Are you sure you want to delete your provider profile? This action cannot be undone. All your services will be deactivated and you'll need to recreate your provider profile if you want to become a provider again."
        confirmLabel="Delete Profile"
        onCancel={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteProvider}
      />


      </div>
    </div>
  );
}



