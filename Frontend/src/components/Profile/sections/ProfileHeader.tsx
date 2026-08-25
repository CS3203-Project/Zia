import { useState } from 'react';
import { Shield, ShieldAlert, Phone, MapPin, Edit2, Trash2, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../shared/Button';
import { accountApi } from '../../../api/accountApi';
import type { UserProfile, ProviderProfile } from '../../../api/userApi';

interface ProfileHeaderProps {
  user: UserProfile;
  providerProfile: ProviderProfile | null;
  onEditProfile: () => void;
  onEditProvider: () => void;
  onDeleteProviderClick: () => void;
}

export default function ProfileHeader({
  user,
  providerProfile,
  onEditProfile,
  onEditProvider,
  onDeleteProviderClick
}: ProfileHeaderProps) {
  const [resending, setResending] = useState(false);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      toast.success(await accountApi.sendVerification());
    } catch {
      toast.error('Could not send the verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] overflow-hidden mb-8 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300">
      {/* Banner - Minimal Gradient */}
      <div className="relative h-36 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
        <img
          src="https://4kwallpapers.com/images/walls/thumbs_3t/8728.jpg"
          alt="Profile Banner"
          className="w-full h-full object-cover opacity-10 mix-blend-overlay"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-black/2 to-black/5"></div>

        {/* Avatar - half above the banner */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-16 z-10">
          <div className="relative group">
            {user.imageUrl && user.imageUrl.trim() ? (
              <img
                src={user.imageUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="relative w-32 h-32 rounded-full border-4 border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] object-cover backdrop-blur-sm"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  const defaultAvatar = img.nextElementSibling as HTMLElement;
                  if (defaultAvatar) defaultAvatar.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`relative w-32 h-32 rounded-full border-4 border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] backdrop-blur-md bg-white/50 flex items-center justify-center text-gray-900 text-3xl font-bold ${
                user.imageUrl && user.imageUrl.trim() ? 'hidden' : 'flex'
              }`}
            >
              {((user.firstName || '').charAt(0) || 'U').toUpperCase()}
              {((user.lastName || '').charAt(0) || 'S').toUpperCase()}
            </div>
          </div>
        </div>
      </div>
      {/* Header Content */}
      <div className="px-4 sm:px-6 pb-6 bg-gradient-to-b from-white/10 to-transparent">
        <div className="flex flex-col lg:flex-row items-center lg:items-end lg:space-x-8 mt-0">
          {/* Spacer for avatar */}
          <div className="w-32 h-16 lg:hidden" />
          {/* Info & Actions */}
          <div className="flex-1 text-center lg:text-left ml-5 mt-13 lg:mt-0">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent mt-4 mb-1">
                  {user.firstName || 'First'} {user.lastName || 'Last'}
                </h1>
                <p className="text-gray-500 text-lg mb-1">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-md ${
                      user.role === 'PROVIDER'
                        ? 'bg-white/50 text-gray-900 border-white/30'
                        : 'bg-white/50 text-gray-900 border-white/30'
                    } shadow-[0_4px_16px_0_rgba(0,0,0,0.08)]`}
                  >
                    {user.role === 'PROVIDER' ? 'Service Provider' : 'User'}
                  </span>
                  {user.isEmailVerified ? (
                    <span className="flex items-center text-gray-900 bg-white/50 px-3 py-1 rounded-full border border-white/30 backdrop-blur-md shadow-[0_4px_16px_0_rgba(0,0,0,0.08)]">
                      <Shield className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Verified</span>
                    </span>
                  ) : (
                    // Unverified accounts previously had no way forward at all -
                    // nothing in the product could ever set isEmailVerified.
                    <button
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60"
                    >
                      <ShieldAlert className="mr-1 h-4 w-4" />
                      <span className="text-sm font-medium">
                        {resending ? 'Sending…' : 'Verify email'}
                      </span>
                    </button>
                  )}
                  {user.phone && (
                    <span className="flex items-center text-gray-900 bg-white/50 px-3 py-1 rounded-full border border-white/30 backdrop-blur-md shadow-[0_4px_16px_0_rgba(0,0,0,0.08)]">
                      <Phone className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">{user.phone}</span>
                    </span>
                  )}
                  {user.location && (
                    <span className="flex items-center text-gray-900 bg-white/50 px-3 py-1 rounded-full border border-white/30 backdrop-blur-md shadow-[0_4px_16px_0_rgba(0,0,0,0.08)]">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">{user.location}</span>
                    </span>
                  )}
                </div>
              </div>
              {/* Edit Profile Button */}
              <Button
                onClick={onEditProfile}
                className="flex items-center space-x-2"
                size="sm"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            </div>
            {/* Provider Actions */}
            {user.role === 'PROVIDER' && (
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-3">
                <Button
                  onClick={onEditProvider}
                  variant="tonal"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit Provider</span>
                </Button>
                <Button
                  onClick={onDeleteProviderClick}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 !text-red-600 !border-red-200 hover:!bg-red-50 hover:!border-red-300 hover:!text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Provider</span>
                </Button>
              </div>
            )}
            {/* Company Info in Header */}
            {providerProfile && providerProfile.companies && providerProfile.companies.length > 0 && (
              <div className="flex items-center mt-4 bg-white/50 backdrop-blur-md rounded-xl p-3 border border-white/30 shadow-[0_4px_16px_0_rgba(0,0,0,0.08)]">
                {providerProfile.companies[0].logo ? (
                  <img
                    src={providerProfile.companies[0].logo}
                    alt={providerProfile.companies[0].name}
                    className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-white/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center mr-3 border-2 border-white/50">
                    <Building className="h-5 w-5 text-gray-900" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">{providerProfile.companies[0].name}</span>
              </div>
            )}
            {/* Social Media Links */}
          </div>
        </div>
      </div>
    </div>
  );
}
