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

const inputClass =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors hover:border-gray-300';

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
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 pt-24 sm:pt-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Provider Profile</h2>
            <p className="text-gray-500 mt-1">Update your professional information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 group"
            disabled={loading}
            title="Close modal"
          >
            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
            {/* Bio Section */}
            <div className="space-y-3 pb-8 border-b border-gray-100">
              <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center">
                <FileText className="h-4 w-4 mr-2 text-orange-600" />
                Professional Bio
              </label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className={`${inputClass} resize-none`}
                rows={4}
                placeholder="Tell potential clients about yourself, your experience, and what makes you unique..."
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400">
                  Share your story and professional journey
                </p>
                <p className="text-xs text-gray-400">
                  {formData.bio?.length || 0}/1000
                </p>
              </div>
            </div>

            {/* Logo URL Section */}
            <div className="space-y-3 pb-8 border-b border-gray-100">
              <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center">
                <Camera className="h-4 w-4 mr-2 text-orange-600" />
                Profile Image URL
              </label>
              <input
                type="url"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                className={inputClass}
                placeholder="https://example.com/your-profile-image.jpg"
              />
              <p className="text-xs text-gray-400">
                Add a professional headshot or company logo
              </p>
            </div>

            {/* ID Card URL Section */}
            <div className="space-y-3 pb-8 border-b border-gray-100">
              <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center">
                <Award className="h-4 w-4 mr-2 text-orange-600" />
                ID Card/Document
                <span className="text-gray-400 font-normal normal-case tracking-normal ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.IDCardUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, IDCardUrl: e.target.value }))}
                className={inputClass}
                placeholder="Enter image URL or text identifier for your ID document"
              />
              <p className="text-xs text-gray-400">
                Professional license or ID for verification purposes
              </p>
            </div>

            {/* Skills Section */}
            <div className="space-y-3 pb-8 border-b border-gray-100">
              <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center">
                <Star className="h-4 w-4 mr-2 text-orange-600" />
                Skills & Expertise
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className={`flex-1 ${inputClass}`}
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
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center">
                <Award className="h-4 w-4 mr-2 text-orange-600" />
                Qualifications & Certifications
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  className={`flex-1 ${inputClass}`}
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
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
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
