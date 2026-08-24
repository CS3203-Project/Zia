import { X, Save } from 'lucide-react';
import Button from '../../shared/Button';
import LocationPickerAdvanced from '../../shared/LocationPickerAdvanced';
import type { LocationParams } from '../../../api/hybridSearchApi';

export interface ServiceFormData {
  title: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
  images: string[];
  isActive: boolean;
  workingTime: string[];
  // Location fields
  latitude?: number;
  longitude?: number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  serviceRadiusKm: number;
}

interface UpdateServiceModalProps {
  isOpen: boolean;
  serviceFormData: ServiceFormData;
  uploadingImages: boolean;
  onFormChange: (field: string, value: string | number | boolean | string[]) => void;
  onLocationChange: (location: LocationParams | null) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function UpdateServiceModal({
  isOpen,
  serviceFormData,
  uploadingImages,
  onFormChange,
  onLocationChange,
  onImageUpload,
  onRemoveImage,
  onClose,
  onSubmit
}: UpdateServiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Update Service</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition-colors"
            title="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Service Title */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Service Title *
            </label>
            <input
              type="text"
              value={serviceFormData.title}
              onChange={(e) => onFormChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-900 placeholder-gray-400 backdrop-blur-sm"
              placeholder="Enter service title"
            />
          </div>

          {/* Service Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={serviceFormData.description}
              onChange={(e) => onFormChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-900 placeholder-gray-400 backdrop-blur-sm"
              placeholder="Describe your service..."
            />
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Price *
              </label>
              <input
                type="number"
                value={serviceFormData.price}
                onChange={(e) => onFormChange('price', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-900 placeholder-gray-400 backdrop-blur-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Currency
              </label>
              <select
                value={serviceFormData.currency}
                onChange={(e) => onFormChange('currency', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-900 backdrop-blur-sm"
                title="Select currency"
              >
                <option value="LKR" className="bg-white text-gray-900">LKR</option>
                <option value="USD" className="bg-white text-gray-900">USD</option>
                <option value="EUR" className="bg-white text-gray-900">EUR</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={serviceFormData.tags.join(', ')}
              onChange={(e) => onFormChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-900 placeholder-gray-400 backdrop-blur-sm"
              placeholder="web development, design, frontend"
            />
          </div>

          {/* Working Time */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Working Time (comma-separated)
            </label>
            <input
              type="text"
              value={serviceFormData.workingTime.join(', ')}
              onChange={(e) => onFormChange('workingTime', e.target.value.split(',').map(time => time.trim()).filter(time => time))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-900 placeholder-gray-400 backdrop-blur-sm"
              placeholder="Monday-Friday 9AM-5PM, Weekends flexible"
              title="Working time schedule"
            />
          </div>

          {/* Location Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Service Location
            </label>
            <LocationPickerAdvanced
              value={serviceFormData.latitude && serviceFormData.longitude ? {
                latitude: serviceFormData.latitude,
                longitude: serviceFormData.longitude,
                address: serviceFormData.address
              } : undefined}
              onChange={onLocationChange}
              className="w-full"
              showMap={true}
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Upload Images
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onImageUpload}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-900 backdrop-blur-sm"
                disabled={uploadingImages}
                title="Upload service images"
              />
              {uploadingImages && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm">Uploading images...</span>
                </div>
              )}
              {serviceFormData.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Uploaded images:</p>
                  <div className="flex flex-wrap gap-2">
                    {serviceFormData.images.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageUrl}
                          alt={`Service image ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border border-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={serviceFormData.isActive}
              onChange={(e) => onFormChange('isActive', e.target.checked)}
              className="rounded border-gray-300 bg-white text-orange-500 focus:ring-orange-400 focus:ring-offset-0"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-400">
              Service is active and visible to clients
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm rounded-b-xl flex space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300 backdrop-blur-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border border-transparent"
            disabled={uploadingImages}
          >
            <Save className="h-4 w-4" />
            <span>{uploadingImages ? 'Uploading...' : 'Update Service'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
