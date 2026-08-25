import { useState, useEffect, useRef } from 'react';
import { X, Save, User, Phone, MapPin, Globe, Upload, Image } from 'lucide-react';
import Button from '../shared/Button';
import toast from 'react-hot-toast';
import { userApi } from '../../api/userApi';
import type { UpdateProfileData, UserProfile } from '../../api/userApi';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: Partial<UserProfile>) => void;
  user: UserProfile;
}

export default function EditProfileModal({ isOpen, onClose, onSuccess, user }: EditProfileModalProps) {
  const [formData, setFormData] = useState<UpdateProfileData>({});
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      // Initialize social media array with 5 slots (Twitter, LinkedIn, Instagram, GitHub, Website)
      const socialMediaArray = new Array(5).fill('');
      if (user.socialmedia && user.socialmedia.length > 0) {
        user.socialmedia.forEach((link, index) => {
          if (index < 5) {
            socialMediaArray[index] = link;
          }
        });
      }

      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl || '',
        location: user.location || '',
        phone: user.phone || '',
        address: user.address || '',
        socialmedia: socialMediaArray
      });

      // Reset file selection when modal opens
      setSelectedFile(null);
      setPreviewUrl('');
    }
  }, [isOpen, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Add form fields
      if (formData.firstName) submitData.append('firstName', formData.firstName);
      if (formData.lastName) submitData.append('lastName', formData.lastName);
      if (formData.location) submitData.append('location', formData.location);
      if (formData.phone) submitData.append('phone', formData.phone);
      if (formData.address) submitData.append('address', formData.address);

      // Add social media links (filter out empty ones)
      const socialMediaLinks = formData.socialmedia?.filter(link => link && link.trim()) || [];
      submitData.append('socialmedia', JSON.stringify(socialMediaLinks));

      // Add image file if selected
      if (selectedFile) {
        submitData.append('profileImage', selectedFile);
      } else if (formData.imageUrl?.trim()) {
        // If no new file but imageUrl is provided, send it as well
        submitData.append('imageUrl', formData.imageUrl.trim());
      }

      const updatedUser = await userApi.updateProfileWithImage(submitData);
      toast.success('Profile updated successfully!');
      onSuccess(updatedUser);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-orange-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-orange-600" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                Location Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location/City
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Enter your city or location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                    rows={2}
                    placeholder="Enter your full address"
                  />
                </div>
              </div>
            </div>

            {/* Profile Image */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Image className="h-5 w-5 mr-2 text-orange-600" />
                Profile Image
              </h3>

              {/* Current Image Display */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Profile Image
                </label>
                <div className="flex items-center space-x-4">
                  <img
                    src={previewUrl || formData.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.firstName + ' ' + formData.lastName)}&background=3b82f6&color=fff&size=80`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                  />
                  {(previewUrl || selectedFile) && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-700 text-sm font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg border border-red-100 transition-colors"
                    >
                      Remove new image
                    </button>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Image
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedFile ? selectedFile.name : 'Max size: 5MB'}
                  </span>
                </div>
              </div>

              {/* URL Input (Alternative) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, imageUrl: e.target.value.trim() || undefined }));
                    // Clear file selection if URL is entered
                    if (e.target.value.trim()) {
                      setSelectedFile(null);
                      setPreviewUrl('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="https://example.com/your-image.jpg"
                  disabled={!!selectedFile}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {selectedFile ? 'URL input disabled while file is selected' : 'Enter a direct link to your image or upload a file above'}
                </p>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-orange-600" />
                Social Media
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter/X
                  </label>
                  <input
                    type="text"
                    value={formData.socialmedia?.[0] || ''}
                    onChange={(e) => {
                      const newSocial = [...(formData.socialmedia || new Array(5).fill(''))];
                      newSocial[0] = e.target.value.trim();
                      setFormData(prev => ({ ...prev, socialmedia: newSocial }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="twitter.com/username or x.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    value={formData.socialmedia?.[1] || ''}
                    onChange={(e) => {
                      const newSocial = [...(formData.socialmedia || new Array(5).fill(''))];
                      newSocial[1] = e.target.value.trim();
                      setFormData(prev => ({ ...prev, socialmedia: newSocial }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.socialmedia?.[2] || ''}
                    onChange={(e) => {
                      const newSocial = [...(formData.socialmedia || new Array(5).fill(''))];
                      newSocial[2] = e.target.value.trim();
                      setFormData(prev => ({ ...prev, socialmedia: newSocial }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="instagram.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub
                  </label>
                  <input
                    type="text"
                    value={formData.socialmedia?.[3] || ''}
                    onChange={(e) => {
                      const newSocial = [...(formData.socialmedia || new Array(5).fill(''))];
                      newSocial[3] = e.target.value.trim();
                      setFormData(prev => ({ ...prev, socialmedia: newSocial }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="github.com/username"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website/Portfolio
                  </label>
                  <input
                    type="url"
                    value={formData.socialmedia?.[4] || ''}
                    onChange={(e) => {
                      const newSocial = [...(formData.socialmedia || new Array(5).fill(''))];
                      newSocial[4] = e.target.value.trim();
                      setFormData(prev => ({ ...prev, socialmedia: newSocial }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <p className="text-xs text-gray-400 sm:col-span-2 bg-white rounded-lg p-3 border border-gray-100">
                  Leave fields empty if you don't have accounts on these platforms.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Always visible */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
