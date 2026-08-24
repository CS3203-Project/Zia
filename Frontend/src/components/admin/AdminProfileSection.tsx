import React, { useState } from 'react';
import { LogOut, Settings } from 'lucide-react';
import Button from '../shared/Button';
import type { AdminProfile } from '../../api/adminApi';
import { showErrorToast } from '../../utils/toastUtils';

interface AdminProfileSectionProps {
  profile: AdminProfile | null;
  onUpdateProfile: (data: Partial<AdminProfile>) => void;
  onLogout: () => void;
}

const AdminProfileSection: React.FC<AdminProfileSectionProps> = ({ profile, onUpdateProfile, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    username: profile?.username || '',
    password: '',
    confirmPassword: '',
  });

  // Check if passwords match
  const passwordsMatch = !formData.password || formData.password === formData.confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password confirmation if password is provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      showErrorToast('Passwords do not match');
      return;
    }

    // Remove confirmPassword from the data sent to API
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...profileData } = formData;
    onUpdateProfile(profileData);
    setIsEditing(false);

    // Reset form data
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      username: profile?.username || '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      username: profile?.username || '',
      password: '',
      confirmPassword: '',
    });
  };

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Admin Profile</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{ colorScheme: 'light' }}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={{ colorScheme: 'light' }}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                style={{ colorScheme: 'light' }}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ colorScheme: 'light' }}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Leave empty to keep current password"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                style={{ colorScheme: 'light' }}
                className={`w-full px-3 py-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  formData.confirmPassword && !passwordsMatch
                    ? 'border-red-300 bg-red-50'
                    : formData.confirmPassword && passwordsMatch
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200'
                }`}
                placeholder="Confirm your new password"
                disabled={!formData.password}
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
              {formData.confirmPassword && passwordsMatch && formData.password && (
                <p className="mt-1 text-sm text-green-600">Passwords match</p>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={!passwordsMatch}
              className={!passwordsMatch ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {profile.firstName} {profile.lastName}
              </h3>
              <p className="text-gray-500">@{profile.username}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mt-1">
                {profile.role || 'ADMIN'}
              </span>
            </div>
          </div>

          {profile.lastLogin && (
            <div className="text-sm text-gray-500">
              Last login: {new Date(profile.lastLogin).toLocaleString()}
            </div>
          )}

          {profile.permissions && profile.permissions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {profile.permissions.map((permission, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProfileSection;
