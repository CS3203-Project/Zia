import { Mail, Phone, MapPin, Calendar, ExternalLink } from 'lucide-react';
import type { UserProfile } from '../../../api/userApi';

interface BasicInformationCardProps {
  user: UserProfile;
}

export default function BasicInformationCard({ user }: BasicInformationCardProps) {
  return (
    <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300">
      <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent mb-4">Basic Information</h2>
      <div className="space-y-3">
        <div className="group flex items-center space-x-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 hover:scale-102 transition-all duration-200">
          <div className="w-10 h-10 rounded-lg bg-white/50 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Mail className="h-5 w-5 text-gray-900" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Email</p>
            <p className="text-sm font-semibold text-gray-900">{user.email}</p>
          </div>
        </div>

        {user.phone && (
          <div className="group flex items-center space-x-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 hover:scale-102 transition-all duration-200">
            <div className="w-10 h-10 rounded-lg bg-white/50 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Phone className="h-5 w-5 text-gray-900" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Phone</p>
              <p className="text-sm font-semibold text-gray-900">{user.phone}</p>
            </div>
          </div>
        )}

        {user.location && (
          <div className="group flex items-center space-x-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 hover:scale-102 transition-all duration-200">
            <div className="w-10 h-10 rounded-lg bg-white/50 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <MapPin className="h-5 w-5 text-gray-900" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Location</p>
              <p className="text-sm font-semibold text-gray-900">{user.location}</p>
            </div>
          </div>
        )}

        {user.address && (
          <div className="group flex items-start space-x-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 hover:scale-102 transition-all duration-200">
            <div className="w-10 h-10 rounded-lg bg-white/50 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <MapPin className="h-5 w-5 text-gray-900 mt-0.5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Address</p>
              <p className="text-sm font-semibold text-gray-900">{user.address}</p>
            </div>
          </div>
        )}

        <div className="group flex items-center space-x-3 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 hover:scale-102 transition-all duration-200">
          <div className="w-10 h-10 rounded-lg bg-white/50 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Calendar className="h-5 w-5 text-gray-900" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Member since</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {user.socialmedia && user.socialmedia.length > 0 && (
          <div className="group flex items-start space-x-3 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30">
            <div className="w-10 h-10 rounded-lg bg-white/50 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <ExternalLink className="h-5 w-5 text-gray-900 mt-0.5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium mb-2">Social Media</p>
              <div className="space-y-2">
                {user.socialmedia.map((link, index) => {
                  const url = link.startsWith('http') ? link : `https://${link}`;
                  const username = url.split('/').pop(); // Extract username from URL
                  const platformIcon = url.includes('twitter') || url.includes('x.com')
                    ? <i className="fab fa-twitter text-gray-900"></i>
                    : url.includes('linkedin')
                    ? <i className="fab fa-linkedin text-gray-900"></i>
                    : url.includes('instagram')
                    ? <i className="fab fa-instagram text-gray-900"></i>
                    : url.includes('github')
                    ? <i className="fab fa-github text-gray-900"></i>
                    : url.includes('portfolio') || url.includes('website')
                    ? <i className="fas fa-globe text-gray-900"></i>
                    : <i className="fas fa-link text-gray-900"></i>;

                  return (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-900 text-sm font-medium transition-all duration-200 px-3 py-2 rounded-lg hover:bg-white/50 backdrop-blur-sm border border-transparent hover:border-white/30"
                    >
                      <span className="mr-2">{platformIcon}</span>
                      {username}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
