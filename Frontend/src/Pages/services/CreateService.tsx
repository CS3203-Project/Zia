import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import { serviceApi } from '../../api/serviceApi';
import { categoryApi } from '../../api/categoryApi';
import { userApi } from '../../api/userApi';
import apiClient from '../../api/axios';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils';
import type { CreateServiceRequest } from '../../api/serviceApi';
import type { Category } from '../../api/categoryApi';
import type { ProviderProfile } from '../../api/userApi';
import type { LocationInfo } from '../../services/locationService';
import { FiPlus } from 'react-icons/fi';
import CategorySection from '../../components/services/create/CategorySection';
import ServiceDetailsSection from '../../components/services/create/ServiceDetailsSection';
import ImagesSection from '../../components/services/create/ImagesSection';
import VideoSection from '../../components/services/create/VideoSection';
import TagsSection from '../../components/services/create/TagsSection';
import WorkingHoursSection from '../../components/services/create/WorkingHoursSection';
import ServiceStatusSection from '../../components/services/create/ServiceStatusSection';
import LocationSection from '../../components/services/create/LocationSection';
import {
  defaultWorkingHours,
  type CreateServiceFormData,
  type CreateServiceFormErrors,
  type WorkingHours,
} from '../../components/services/create/types';

export default function CreateService() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CreateServiceFormData>({
    categoryId: '',
    subcategoryId: '',
    title: '',
    description: '',
    price: '',
    currency: 'LKR',
    tags: [],
    images: [],
    uploadedImageUrls: [],
    video: null,
    uploadedVideoUrl: '',
    workingTime: defaultWorkingHours,
    isActive: true,
    location: {}
  });

  const [errors, setErrors] = useState<Partial<CreateServiceFormErrors>>({});

  // Fetch categories and provider profile on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await categoryApi.getRootCategories({ includeChildren: true });
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        }

        // Fetch provider profile
        const providerData = await userApi.getProviderProfile();
        setProviderProfile(providerData);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        showErrorToast('Failed to load required data');
        // Redirect back to profile if user is not a provider
        navigate('/profile');
      }
    };

    fetchData();
  }, [navigate]);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (formData.categoryId) {
        try {
          const categoryResponse = await categoryApi.getCategoryById(formData.categoryId, { includeChildren: true });
          if (categoryResponse.success && categoryResponse.data.children) {
            setSubcategories(categoryResponse.data.children);
          } else {
            setSubcategories([]);
          }
        } catch (error) {
          console.error('Failed to fetch subcategories:', error);
          setSubcategories([]);
        }
      } else {
        setSubcategories([]);
      }
      // Reset subcategory when category changes
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
    };

    fetchSubcategories();
  }, [formData.categoryId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateServiceFormErrors> = {};

    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (formData.images.length === 0 && formData.uploadedImageUrls.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload image to S3 using backend endpoint
  const uploadImageToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Use axios with authentication (handled by interceptor)
      const response = await apiClient.post('/users/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.imageUrl) {
        console.log(`Successfully uploaded ${file.name} to S3:`, response.data.imageUrl);
        return response.data.imageUrl;
      } else {
        throw new Error('No image URL returned from server');
      }
    } catch (error: any) {
      console.error('Error uploading image to S3:', error);

      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          throw new Error(`Authentication required. Please log in again.`);
        } else if (error.response.status === 413) {
          throw new Error(`File ${file.name} is too large. Please select a smaller image.`);
        } else {
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Upload failed';
          throw new Error(`Failed to upload ${file.name}: ${errorMessage}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error(`Failed to upload ${file.name}: Network error`);
      } else {
        // Something else happened
        throw new Error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Upload video to S3 using backend endpoint
  const uploadVideoToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('video', file);

    try {
      // Use axios with authentication (handled by interceptor)
      const response = await apiClient.post('/users/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.videoUrl) {
        console.log(`Successfully uploaded ${file.name} to S3:`, response.data.videoUrl);
        return response.data.videoUrl;
      } else {
        throw new Error('No video URL returned from server');
      }
    } catch (error: any) {
      console.error('Error uploading video to S3:', error);

      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          throw new Error(`Authentication required. Please log in again.`);
        } else if (error.response.status === 413) {
          throw new Error(`File ${file.name} is too large. Please select a smaller video (max 100MB).`);
        } else {
          throw new Error(`Failed to upload ${file.name}. Server error: ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        throw new Error(`Network error. Please check your connection and try again.`);
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof CreateServiceFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check total images limit (5)
    const totalImages = formData.images.length + formData.uploadedImageUrls.length + files.length;
    if (totalImages > 5) {
      showErrorToast('You can upload maximum 5 images');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        showErrorToast(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showErrorToast(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...validFiles]
      }));

      // Create preview URLs
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviews]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    // Clean up preview URL
    if (previewImages[index]) {
      URL.revokeObjectURL(previewImages[index]);
    }
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    const trimmedTag = currentTag.trim();

    // Validation checks
    if (!trimmedTag) return;
    if (trimmedTag.length > 30) {
      showErrorToast('Tag must not exceed 30 characters');
      return;
    }
    if (formData.tags.includes(trimmedTag)) {
      showErrorToast('Tag already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, trimmedTag]
    }));
    setCurrentTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleWorkingHoursChange = (day: keyof WorkingHours, field: 'enabled' | 'startTime' | 'endTime', value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      workingTime: {
        ...prev.workingTime,
        [day]: {
          ...prev.workingTime[day],
          [field]: value
        }
      }
    }));
  };

  const formatWorkingHoursForAPI = (workingHours: WorkingHours): string[] => {
    const result: string[] = [];

    // Helper function to convert 24-hour time to 12-hour format with AM/PM
    const convertTo12Hour = (time24: string): string => {
      const [hours, minutes] = time24.split(':');
      const hour24 = parseInt(hours, 10);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    };

    Object.entries(workingHours).forEach(([day, hours]) => {
      if (hours.enabled) {
        const formattedDay = day.charAt(0).toUpperCase() + day.slice(1);
        const startTime12 = convertTo12Hour(hours.startTime);
        const endTime12 = convertTo12Hour(hours.endTime);
        result.push(`${formattedDay}: ${startTime12} - ${endTime12}`);
      }
    });

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorToast('Please fix the errors in the form');
      return;
    }

    if (!providerProfile?.id) {
      showErrorToast('Provider profile not found. Please ensure you are a verified provider.');
      return;
    }

    setLoading(true);

    try {
      // Upload images and video to S3 first
      setUploading(true);
      const uploadedUrls: string[] = [...formData.uploadedImageUrls];
      let videoUrl = formData.uploadedVideoUrl;

      // Upload video if present
      if (formData.video) {
        showSuccessToast('Uploading video to S3...');
        try {
          console.log(`Uploading video: ${formData.video.name}`);
          videoUrl = await uploadVideoToS3(formData.video);
          console.log(`Successfully uploaded video to:`, videoUrl);
          showSuccessToast('Video uploaded successfully!');
        } catch (error) {
          console.error('Failed to upload video:', formData.video.name, error);
          showErrorToast(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setLoading(false);
          setUploading(false);
          return;
        }
      }

      if (formData.images.length > 0) {
        showSuccessToast(`Uploading ${formData.images.length} image(s) to S3...`);

        for (let i = 0; i < formData.images.length; i++) {
          const file = formData.images[i];
          try {
            console.log(`Uploading image ${i + 1}/${formData.images.length}: ${file.name}`);
            const url = await uploadImageToS3(file);
            uploadedUrls.push(url);
            console.log(`Successfully uploaded ${file.name} to:`, url);
          } catch (error) {
            console.error('Failed to upload image:', file.name, error);
            showErrorToast(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Continue with other uploads
          }
        }
      }

      setUploading(false);

      if (uploadedUrls.length === 0) {
        showErrorToast('At least one image must be uploaded successfully');
        return;
      }

      showSuccessToast(`Successfully uploaded ${uploadedUrls.length} image(s). Creating service...`);

      const serviceData: CreateServiceRequest = {
        providerId: providerProfile.id,
        categoryId: formData.subcategoryId || formData.categoryId, // Use subcategory if selected, otherwise main category
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        tags: formData.tags,
        images: uploadedUrls,
        videoUrl: videoUrl || undefined,
        workingTime: formatWorkingHoursForAPI(formData.workingTime),
        isActive: formData.isActive,
        // Location fields (only include if provided)
        ...(formData.location.latitude && formData.location.longitude && {
          latitude: formData.location.latitude,
          longitude: formData.location.longitude,
          address: formData.location.address,
          city: formData.location.city,
          state: formData.location.state,
          country: formData.location.country,
          postalCode: formData.location.postalCode,
          serviceRadiusKm: formData.location.serviceRadiusKm || 10
        })
      };

      console.log('Formatted working time:', formatWorkingHoursForAPI(formData.workingTime));
      console.log('Sending service data:', serviceData);

      const response = await serviceApi.createService(serviceData);

      if (response.success) {
        showSuccessToast('Service created successfully!');
        navigate('/profile');
      } else {
        showErrorToast(response.message || 'Failed to create service');
      }
    } catch (error: unknown) {
      console.error('Error creating service:', error);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: string; details?: unknown } } };
        console.log('Full error response:', axiosError.response?.data);

        if (axiosError.response?.data?.message) {
          showErrorToast(axiosError.response.data.message);
        } else if (axiosError.response?.data?.error) {
          showErrorToast(axiosError.response.data.error);
        } else if (axiosError.response?.data?.details) {
          const details = axiosError.response.data.details;
          if (Array.isArray(details) && details.length > 0) {
            const firstError = details[0] as { message?: string };
            showErrorToast(`Validation error: ${firstError.message || 'Unknown validation error'}`);
          } else {
            showErrorToast('Validation failed. Check console for details.');
          }
        } else {
          showErrorToast('Failed to create service. Please try again.');
        }
      } else {
        showErrorToast('Failed to create service. Please try again.');
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      showErrorToast(`${file.name} is not a valid video file`);
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      showErrorToast(`${file.name} is too large. Maximum size is 100MB`);
      return;
    }

    // Check video duration (optional - basic check via file size as proxy)
    // For a more robust solution, you'd want to use video element to check duration

    setFormData(prev => ({
      ...prev,
      video: file
    }));

    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveVideo = () => {
    setFormData(prev => ({
      ...prev,
      video: null,
      uploadedVideoUrl: ''
    }));
  };

  const handleLocationChange = async (location: LocationInfo & { serviceRadiusKm?: number }) => {
    if (!location) {
      setFormData(prev => ({
        ...prev,
        location: {}
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

    setFormData(prev => ({
      ...prev,
      location: updatedLocation
    }));
  };

  const handleToggleActive = (isActive: boolean) => {
    setFormData(prev => ({ ...prev, isActive }));
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-16">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

          {/* Header */}
          <div className="flex items-center space-x-4 px-8 py-6 border-b border-gray-100">
            <div className="p-3 bg-orange-50 rounded-xl">
              <FiPlus className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Service</h1>
              <p className="text-gray-500 mt-1">Share your expertise and start earning on the platform.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative p-8 space-y-8">
            <CategorySection
              categories={categories}
              subcategories={subcategories}
              categoryId={formData.categoryId}
              subcategoryId={formData.subcategoryId}
              categoryError={errors.categoryId}
              onInputChange={handleInputChange}
            />

            <ServiceDetailsSection
              title={formData.title}
              description={formData.description}
              price={formData.price}
              currency={formData.currency}
              titleError={errors.title}
              descriptionError={errors.description}
              priceError={errors.price}
              onInputChange={handleInputChange}
            />

            <ImagesSection
              images={formData.images}
              uploadedImageUrls={formData.uploadedImageUrls}
              previewImages={previewImages}
              isUploading={uploading}
              imagesError={errors.images}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onRemoveImage={handleRemoveImage}
            />

            <VideoSection
              video={formData.video}
              uploadedVideoUrl={formData.uploadedVideoUrl}
              isUploading={uploading}
              onVideoChange={handleVideoChange}
              onRemoveVideo={handleRemoveVideo}
            />

            <TagsSection
              tags={formData.tags}
              currentTag={currentTag}
              onCurrentTagChange={setCurrentTag}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />

            <WorkingHoursSection
              workingTime={formData.workingTime}
              previewLines={formatWorkingHoursForAPI(formData.workingTime)}
              onWorkingHoursChange={handleWorkingHoursChange}
            />

            <ServiceStatusSection
              isActive={formData.isActive}
              onToggleActive={handleToggleActive}
            />

            <LocationSection
              location={formData.location}
              isDisabled={loading || uploading}
              onLocationChange={handleLocationChange}
            />

            {/* Submit Buttons */}
            <div className="pt-8 border-t border-gray-100">
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  disabled={loading || uploading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="min-w-[160px] flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Uploading...
                    </>
                  ) : loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-4 h-4 mr-2" />
                      Create Service
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
