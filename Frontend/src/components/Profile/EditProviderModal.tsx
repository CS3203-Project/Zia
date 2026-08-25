import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, FileText, Camera, Award, Star } from 'lucide-react';
import Button from '../shared/Button';
import toast from 'react-hot-toast';
import { userApi } from '../../api/userApi';
import type { UpdateProviderData, ProviderProfile } from '../../api/userApi';

interface EditProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProvider: ProviderProfile) => void;
  provider: ProviderProfile;
}

export default function EditProviderModal({ isOpen, onClose, onSuccess, provider }: EditProviderModalProps) {
  const [formData, setFormData] = useState<UpdateProviderData>({});
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newQualification, setNewQualification] = useState('');

  useEffect(() => {
    if (isOpen && provider) {
      setFormData({
        bio: provider.bio || '',
        skills: [...(provider.skills || [])],
        qualifications: [...(provider.qualifications || [])],
        logoUrl: provider.logoUrl || '',
        IDCardUrl: provider.IDCardUrl || ''
      });
    }
  }, [isOpen, provider]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const updatedProvider = await userApi.updateProvider(formData);
      toast.success('Provider profile updated successfully!');
      onSuccess(updatedProvider);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update provider profile');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove) || []
    }));
  };

  const addQualification = () => {
    if (newQualification.trim() && !formData.qualifications?.includes(newQualification.trim())) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...(prev.qualifications || []), newQualification.trim()]
      }));
      setNewQualification('');
    }
  };

  const removeQualification = (qualificationToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications?.filter(qual => qual !== qualificationToRemove) || []
    }));
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Provider Profile</h2>
              <p className="text-sm text-gray-500">Update your professional information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600 group"
            disabled={loading}
            title="Close modal"
          >
            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Bio Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-sm font-medium text-gray-900">
                  Professional Bio
                </label>
              </div>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400 transition-colors hover:border-gray-300"
                rows={4}
                placeholder="Tell potential clients about yourself, your experience, and what makes you unique..."
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-400">
                  Share your story and professional journey
                </p>
                <p className="text-xs text-gray-400">
                  {formData.bio?.length || 0}/1000
                </p>
              </div>
            </div>

            {/* Logo URL Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Camera className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-sm font-medium text-gray-900">
                  Profile Image URL
                </label>
              </div>
              <input
                type="url"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-colors hover:border-gray-300"
                placeholder="https://example.com/your-profile-image.jpg"
              />
              <p className="text-xs text-gray-400 mt-2">
                Add a professional headshot or company logo
              </p>
            </div>

            {/* ID Card URL Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Award className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-sm font-medium text-gray-900">
                  ID Card/Document
                  <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
              </div>
              <input
                type="text"
                value={formData.IDCardUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, IDCardUrl: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-colors hover:border-gray-300"
                placeholder="Enter image URL or text identifier for your ID document"
              />
              <p className="text-xs text-gray-400 mt-2">
                Professional license or ID for verification purposes
              </p>
            </div>

            {/* Skills Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-sm font-medium text-gray-900">
                  Skills & Expertise
                </label>
              </div>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-colors hover:border-gray-300"
                  placeholder="Enter a skill (e.g., React.js, Photography, etc.)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button
                  type="button"
                  onClick={addSkill}
                  size="sm"
                  variant="tonal"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-100"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-orange-400 hover:text-red-500 transition-colors"
                      title={`Remove ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              {formData.skills?.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-4">
                  No skills added yet. Add your first skill above!
                </p>
              )}
            </div>

            {/* Qualifications Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Award className="h-4 w-4 text-orange-600" />
                </div>
                <label className="text-sm font-medium text-gray-900">
                  Qualifications & Certifications
                </label>
              </div>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-colors hover:border-gray-300"
                  placeholder="Enter a qualification (e.g., Bachelor's in Computer Science)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                />
                <Button
                  type="button"
                  onClick={addQualification}
                  size="sm"
                  variant="tonal"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {formData.qualifications?.map((qualification, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-orange-50 rounded-xl border border-orange-100"
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Award className="h-3 w-3 text-orange-600" />
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed flex-1">{qualification}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQualification(qualification)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                      title={`Remove ${qualification}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {formData.qualifications?.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-4">
                  No qualifications added yet. Add your first qualification above!
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            All changes are saved automatically
          </p>
          <div className="flex items-center space-x-3">
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
                  Update Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
