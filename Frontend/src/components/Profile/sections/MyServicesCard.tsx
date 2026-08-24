import { Briefcase, Edit2, Star, Plus } from 'lucide-react';
import Button from '../../shared/Button';
import type { ProviderProfile } from '../../../api/userApi';
import type { ServiceResponse } from '../../../api/serviceApi';

export interface EditableServiceData {
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
}

interface MyServicesCardProps {
  providerProfile: ProviderProfile | null;
  servicesLoading: boolean;
  services: ServiceResponse[];
  onEditService: (service: EditableServiceData) => void;
  onNavigateToService: (serviceId: string) => void;
  onCreateService: () => void;
}

export default function MyServicesCard({
  providerProfile,
  servicesLoading,
  services,
  onEditService,
  onNavigateToService,
  onCreateService
}: MyServicesCardProps) {
  if (!providerProfile) return null;

  if (servicesLoading) {
    return (
      <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">My Services</h2>
            <p className="text-sm text-gray-500 font-medium">Manage your services</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
          <p className="text-gray-500">Loading services...</p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
            <Briefcase className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No services yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Start showcasing your skills
          </p>
          <Button
            onClick={onCreateService}
            variant="white"
            className="flex items-center space-x-2 mx-auto px-6 py-3 text-sm font-semibold rounded-full hover:scale-105 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            <span>Create First Service</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">My Services</h2>
          <p className="text-sm text-gray-500 font-medium">
            {services.length} service{services.length !== 1 ? 's' : ''} • {services.filter(s => s.isActive).length} active
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => onNavigateToService(service.id)}
            className="group p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 hover:border-white/50 cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-lg"
          >
            <div className="flex items-start gap-3">
              {service.images && service.images.length > 0 ? (
                <img
                  src={service.images[0]}
                  alt={service.title || 'Service image'}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100/50 to-gray-300/50 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-gray-400 opacity-50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                    {service.title || 'Untitled Service'}
                  </h3>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      const serviceData = {
                        id: service.id,
                        title: service.title,
                        description: service.description,
                        price: typeof service.price === 'string' ? parseFloat(service.price) : service.price,
                        currency: service.currency,
                        tags: service.tags,
                        images: service.images,
                        isActive: service.isActive,
                        workingTime: service.workingTime,
                        latitude: service.latitude,
                        longitude: service.longitude,
                        address: service.address,
                        city: service.city,
                        state: service.state,
                        country: service.country,
                        postalCode: service.postalCode,
                        serviceRadiusKm: service.serviceRadiusKm
                      };
                      onEditService(serviceData);
                    }}
                    variant="white"
                    size="sm"
                    className="px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md bg-white/90 border border-white/40 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    title="Edit Service"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-gray-900" strokeWidth={2.5} />
                    <span className="text-xs font-semibold text-gray-900">Edit</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {service.description || 'No description'}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {service.averageRating && service.averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-gray-900" />
                      <span className="font-semibold">{service.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                  {service.reviewCount && service.reviewCount > 0 && (
                    <span>• {service.reviewCount} review{service.reviewCount !== 1 ? 's' : ''}</span>
                  )}
                  <span>• ${service.price}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onCreateService();
        }}
        variant="white"
        className="w-full mt-4 flex items-center justify-center space-x-2 px-6 py-3 text-sm font-semibold rounded-full hover:scale-105 transition-all duration-300"
      >
        <Plus className="h-4 w-4" />
        <span>Create New Service</span>
      </Button>
    </div>
  );
}
