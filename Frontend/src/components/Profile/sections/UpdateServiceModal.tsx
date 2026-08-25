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

const inputClass =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors hover:border-gray-300';

const labelClass = 'block text-sm font-medium text-gray-700 mb-2';

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
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 pt-24 sm:pt-4">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-2xl font-bold text-gray-900">Update Service</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-6">
            {/* Service Title */}
            <div>
              <label className={labelClass}>
                Service Title *
              </label>
              <input
                type="text"
                value={serviceFormData.title}
                onChange={(e) => onFormChange('title', e.target.value)}
                className={inputClass}
                placeholder="Enter service title"
              />
            </div>

            {/* Service Description */}
            <div>
              <label className={labelClass}>
                Description
              </label>
              <textarea
                value={serviceFormData.description}
                onChange={(e) => onFormChange('description', e.target.value)}
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Describe your service..."
              />
            </div>

            {/* Price and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Price *
                </label>
                <input
                  type="number"
                  value={serviceFormData.price}
                  onChange={(e) => onFormChange('price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Currency
                </label>
                <select
                  value={serviceFormData.currency}
                  onChange={(e) => onFormChange('currency', e.target.value)}
                  className={inputClass}
                  title="Select currency"
                >
                  <option value="LKR">LKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={labelClass}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={serviceFormData.tags.join(', ')}
                onChange={(e) => onFormChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                className={inputClass}
                placeholder="web development, design, frontend"
              />
            </div>

            {/* Working Time */}
            <div>
              <label className={labelClass}>
                Working Time (comma-separated)
              </label>
              <input
                type="text"
                value={serviceFormData.workingTime.join(', ')}
                onChange={(e) => onFormChange('workingTime', e.target.value.split(',').map(time => time.trim()).filter(time => time))}
                className={inputClass}
                placeholder="Monday-Friday 9AM-5PM, Weekends flexible"
                title="Working time schedule"
              />
            </div>

            {/* Location Picker */}
            <div>
              <label className={labelClass}>
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
              <label className={labelClass}>
                Upload Images
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onImageUpload}
                  className={inputClass}
                  disabled={uploadingImages}
                  title="Upload service images"
                />
                {uploadingImages && (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-200 border-t-orange-600"></div>
                    <span className="text-sm">Uploading images...</span>
                  </div>
                )}
                {serviceFormData.images.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Uploaded images:</p>
                    <div className="flex flex-wrap gap-2">
                      {serviceFormData.images.map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Service image ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveImage(index)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
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
                className="rounded border-gray-300 bg-white accent-orange-500 focus:ring-orange-500 focus:ring-offset-0"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Service is active and visible to clients
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center space-x-3 px-8 py-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="flex-1 flex items-center justify-center space-x-2"
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
