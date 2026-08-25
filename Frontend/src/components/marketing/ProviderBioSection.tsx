import { User, CheckCircle } from 'lucide-react';
import type { RefObject } from 'react';

interface ProviderBioSectionProps {
  sectionRef: RefObject<HTMLDivElement | null>;
  bio: string;
  error?: string;
  touched?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export default function ProviderBioSection({ sectionRef, bio, error, touched, onChange, onBlur }: ProviderBioSectionProps) {
  return (
    <div ref={sectionRef} className="space-y-6 pb-8 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <label className="flex items-center text-lg font-bold text-gray-900">
          <div className="relative p-2 bg-orange-50 rounded-lg mr-3">
            <User className="h-5 w-5 text-orange-600" />
          </div>
          Tell Us About Yourself
        </label>
        <span className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded-full">Required</span>
      </div>

      <div className="relative group">
        {/* Container */}
        <div className={`relative bg-gray-50 border rounded-2xl overflow-hidden transition-colors duration-200 ${
          error && touched ? 'border-red-300' : 'border-gray-200'
        }`}>
          <textarea
            value={bio || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder="Share your story, experience, and what makes you unique. This helps customers understand your background and expertise..."
            rows={6}
            className="w-full px-6 py-4 bg-transparent border-0 rounded-2xl focus:ring-2 focus:ring-orange-400 resize-none text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none"
            required
          />
          {/* Character counter */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            <div className={`text-xs px-2 py-1 rounded-full ${
              (bio?.length || 0) > 900
                ? 'bg-red-100 text-red-600'
                : (bio?.length || 0) > 700
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {bio?.length || 0}/1000
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && touched && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm flex items-center space-x-2">
              <span className="text-red-500">Warning</span>
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* Success indicator */}
        {bio && bio.length >= 50 && !error && (
          <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-emerald-600 text-sm flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Great! Your bio looks professional.</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex items-start space-x-2 p-4 bg-orange-50 border border-orange-100 rounded-xl">
        <div className="p-1 bg-orange-100 rounded-full">
          <svg className="h-4 w-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-gray-700 text-sm font-medium mb-1">Pro Tip</p>
          <p className="text-gray-600 text-sm">A compelling bio increases your booking chances by up to 40%. Include your experience, specialties, and what makes you unique!</p>
        </div>
      </div>
    </div>
  );
}
