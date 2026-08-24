import React from 'react';
import { PlaceCard } from '../ui/card-22';
import type { ServiceResponse } from '../../api/serviceApi';
import Skeleton from './Skeleton';

interface ServicesGridProps {
  services: ServiceResponse[];
  loading?: boolean;
  error?: string | null;
}

const ServiceCardSkeleton: React.FC = () => (
  <div className="rounded-2xl overflow-hidden bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
    <Skeleton className="aspect-[4/3] rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  </div>
);

const ServicesGrid: React.FC<ServicesGridProps> = ({ services, loading, error }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Services</h3>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white shadow-sm rounded-2xl p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Found</h3>
          <p className="text-gray-500">There are currently no services available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((service) => {
        // Map service data to PlaceCard props
        const images = service.images && service.images.length > 0 
          ? service.images 
          : [
              `https://picsum.photos/seed/${service.id}-1/800/600`,
              `https://picsum.photos/seed/${service.id}-2/800/600`,
              `https://picsum.photos/seed/${service.id}-3/800/600`,
            ];

        const tags = service.tags && service.tags.length > 0 
          ? service.tags.slice(0, 2) 
          : [service.category?.name || 'Service'];

        const providerName = service.provider?.user 
          ? `${service.provider.user.firstName || ''} ${service.provider.user.lastName || ''}`.trim() || service.provider.user.email
          : 'Service Provider';

        const location = service.city && service.state 
          ? `${service.city}, ${service.state}` 
          : service.city || 'Available';

        const distanceText = service.distance 
          ? service.distance < 1 
            ? `${Math.round(service.distance * 1000)}m away`
            : `${service.distance.toFixed(1)}km away`
          : location;

        // Convert price to number if it's a string
        const price = typeof service.price === 'string' ? parseFloat(service.price) : service.price;

        // Get review count from either reviewCount or _count.reviews
        const reviewCount = service.reviewCount || service._count?.reviews || 0;
        // Ensure averageRating is a number
        const averageRating = typeof service.averageRating === 'number' 
          ? service.averageRating 
          : typeof service.averageRating === 'string' 
            ? parseFloat(service.averageRating) 
            : 0;

        // Debug logging for rating
        console.log('Service rating data:', {
          serviceId: service.id,
          title: service.title,
          rawAverageRating: service.averageRating,
          rawAverageRatingType: typeof service.averageRating,
          parsedAverageRating: averageRating,
          reviewCount: reviewCount,
          rawReviewCount: service.reviewCount,
          _countReviews: service._count?.reviews,
          willPassToCard: { rating: averageRating, reviewCount }
        });

        return (
          <PlaceCard
            key={service.id}
            images={images}
            tags={tags}
            rating={averageRating}
            title={service.title || 'Untitled Service'}
            dateRange={distanceText || 'Available'}
            hostType={providerName || 'Service Provider'}
            description={service.description || 'Professional service with quality guaranteed.'}
            pricePerNight={price}
            serviceId={service.id}
            reviewCount={reviewCount}
          />
        );
      })}
    </div>
  );
};

export default ServicesGrid;
