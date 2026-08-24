import React from 'react';
import { Calendar, CheckCircle, Clock, ExternalLink, Star, XCircle } from 'lucide-react';
import Button from '../shared/Button';
import type { ServiceProvider } from '../../api/adminApi';

interface ProviderDetailsModalProps {
  provider: ServiceProvider | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
}

const ProviderDetailsModal: React.FC<ProviderDetailsModalProps> = ({
  provider,
  isOpen,
  onClose,
  onApprove
}) => {
  if (!isOpen || !provider) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto admin-modal border border-gray-100 shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Provider Application Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">
                  {provider.user.firstName} {provider.user.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-sm text-gray-900">{provider.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{provider.user.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Location</label>
                <p className="mt-1 text-sm text-gray-900">{provider.user.location || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {provider.bio && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bio</h3>
              <p className="text-gray-500 bg-gray-50 p-4 rounded-xl">{provider.bio}</p>
            </div>
          )}

          {/* Skills */}
          {provider.skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {provider.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {provider.qualifications.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Qualifications</h3>
              <div className="space-y-2">
                {provider.qualifications.map((qualification, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-xl">
                    <Star className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-gray-600">{qualification}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {provider.services.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Services ({provider.services.length})</h3>
              <div className="space-y-3">
                {provider.services.map((service) => (
                  <div key={service.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{service.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {service.category.name} • Created {new Date(service.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-sm font-medium text-green-600">
                            {service.price} {service.currency}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            service.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rating and Statistics */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{provider._count.services}</p>
                <p className="text-sm text-gray-500">Services</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{provider._count.schedules}</p>
                <p className="text-sm text-gray-500">Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {provider.averageRating ? provider.averageRating.toFixed(1) : 'N/A'}
                </p>
                <p className="text-sm text-gray-500">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{provider.totalReviews || 0}</p>
                <p className="text-sm text-gray-500">Reviews</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Documents</h3>
            <div className="space-y-3">
              {provider.IDCardUrl && (
                <div className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">ID Card Document</span>
                    <a
                      href={provider.IDCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Document
                    </a>
                  </div>
                </div>
              )}
              {provider.logoUrl && (
                <div className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Logo/Profile Image</span>
                    <a
                      href={provider.logoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Image
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Timeline */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Timeline</h3>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Applied: {new Date(provider.createdAt).toLocaleString()}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Last Updated: {new Date(provider.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
          {provider.isVerified ? (
            // Show "Approved" status for verified providers
            <Button
              className="bg-green-600 hover:bg-green-700 cursor-default"
              disabled
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Provider Approved
            </Button>
          ) : (
            // Show only Approve button for unverified providers
            <Button
              onClick={() => {
                onApprove(provider.id);
                onClose();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Provider
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDetailsModal;
