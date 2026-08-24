import React from 'react';
import { Star, Mail, Phone, ArrowUpRight } from 'lucide-react';
import type { ProviderProfile } from '../../../api/userApi';
import Skeleton from '@/components/shared/Skeleton';

interface ServiceProviderCardProps {
  provider: ProviderProfile | null;
  providerLoading: boolean;
  onViewProfile: () => void;
}

/**
 * Provider profile block shown at the top of the booking sidebar:
 * avatar, verified badge, name, contact info, stats, and a "View Full Profile" link.
 * Renders a skeleton placeholder while the provider is still loading.
 */
const ServiceProviderCard: React.FC<ServiceProviderCardProps> = ({
  provider,
  providerLoading,
  onViewProfile
}) => {
  if (providerLoading && !provider) {
    return (
      <div className="mb-8 pb-8 border-b border-gray-100 flex flex-col items-center">
        <Skeleton className="w-20 h-20 rounded-full mb-4" />
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  return (
    <div className="mb-8 pb-8 border-b border-gray-100">
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
        <h3 className="text-xl font-bold text-gray-900 text-center">
          {provider?.user ? `${provider.user.firstName || ''} ${provider.user.lastName || ''}`.trim() || provider.user.email || 'Provider' : 'Provider'}
        </h3>
        <p className="mt-1 text-sm font-medium text-gray-500">
          {provider?.isVerified ? 'Verified Provider' : 'Service Provider'}
        </p>

        {/* Contact Information */}
        {(() => {
          console.log('Provider phone:', provider?.user?.phone);
          return (provider?.user?.email || provider?.user?.phone) && (
            <div className="mt-4 w-full space-y-2">
              {provider?.user?.email && (
                <div className="flex flex-col items-center justify-center gap-1 text-sm bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-900" />
                    <span className="text-gray-500 truncate">{provider.user.email}</span>
                  </div>
                  {provider?.user?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-900" />
                      <span className="text-gray-500">{provider.user.phone}</span>
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
                <span className="text-sm font-semibold text-gray-900">{provider.averageRating.toFixed(1)}</span>
                {provider?.totalReviews !== undefined && provider?.totalReviews !== null && (
                  <span className="text-xs text-gray-400">({provider.totalReviews})</span>
                )}
              </div>
            )}

            {provider?.services?.length !== undefined && provider?.services?.length !== null && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{provider.services.length}</span>
                <span className="text-xs">Service{provider.services.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* View Profile Button */}
        <button
          onClick={onViewProfile}
          className="mt-4 text-sm text-orange-600 hover:underline flex items-center gap-1"
        >
          View Full Profile
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ServiceProviderCard;
