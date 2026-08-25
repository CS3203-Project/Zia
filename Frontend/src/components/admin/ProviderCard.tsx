import React from 'react';
import { CheckCircle, Eye, Mail, MapPin, Phone, ShoppingBag, Star, Clock } from 'lucide-react';
import Button from '../shared/Button';
import type { ServiceProvider } from '../../api/adminApi';

interface ProviderCardProps {
  provider: ServiceProvider;
  onApprove: (id: string) => void;
  onViewDetails: (provider: ServiceProvider) => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onApprove, onViewDetails }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-shadow admin-provider-card">
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <img
          src={provider.user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.user.firstName + ' ' + provider.user.lastName)}&size=64&background=f97316&color=ffffff`}
          alt={`${provider.user.firstName} ${provider.user.lastName}`}
          className="w-16 h-16 rounded-full object-cover ring-2 ring-orange-100 admin-profile-image"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {provider.user.firstName} {provider.user.lastName}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            provider.isVerified
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}>
            {provider.isVerified ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <Clock className="w-3 h-3 mr-1" />
            )}
            {provider.isVerified ? 'Verified' : 'Pending'}
          </span>
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex items-center text-sm text-gray-500">
            <Mail className="w-4 h-4 mr-2" />
            <span className="truncate">{provider.user.email}</span>
          </div>
          {provider.user.phone && (
            <div className="flex items-center text-sm text-gray-500">
              <Phone className="w-4 h-4 mr-2" />
              {provider.user.phone}
            </div>
          )}
          {provider.user.location && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-2" />
              {provider.user.location}
            </div>
          )}
        </div>

        {provider.bio && (
          <p className="mt-3 text-sm text-gray-500 line-clamp-2">{provider.bio}</p>
        )}

        {provider.skills.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Skills:</p>
            <div className="flex flex-wrap gap-1">
              {provider.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700"
                >
                  {skill}
                </span>
              ))}
              {provider.skills.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                  +{provider.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Rating and Services Info */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {provider.averageRating && provider.totalReviews && (
              <div className="flex items-center text-sm text-gray-500">
                <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                {provider.averageRating.toFixed(1)} ({provider.totalReviews} reviews)
              </div>
            )}
            <div className="flex items-center text-sm text-gray-500">
              <ShoppingBag className="w-4 h-4 mr-1" />
              {provider._count.services} services
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Applied: {new Date(provider.createdAt).toLocaleDateString()}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => onViewDetails(provider)}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
            {provider.isVerified ? (
              // Show "Approved" status for verified providers
              <Button
                size="sm"
                className="text-xs bg-green-600 hover:bg-green-700 cursor-default"
                disabled
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Approved
              </Button>
            ) : (
              // Show only Approve button for unverified providers
              <Button
                onClick={() => onApprove(provider.id)}
                size="sm"
                className="text-xs bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Approve
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ProviderCard;
