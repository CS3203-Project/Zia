import { Clock, Save, Shield } from 'lucide-react';
import Button from '../shared/Button';

interface ProviderFormSubmitBarProps {
  onCancel: () => void;
  loading: boolean;
  uploadingLogo: boolean;
  uploadingId: boolean;
}

export default function ProviderFormSubmitBar({ onCancel, loading, uploadingLogo, uploadingId }: ProviderFormSubmitBarProps) {
  return (
    <div className="relative">
      <div className="relative px-8 lg:px-12 py-8 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-6 sm:space-y-0 sm:space-x-6">
          {/* Cancel Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 px-6 py-3 rounded-xl transition-all duration-300"
          >
            Cancel
          </Button>

          {/* Submit Button */}
          <div className="relative group">
            <Button
              type="submit"
              disabled={loading || uploadingLogo || uploadingId}
              className="relative bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 px-8 py-4 text-lg font-bold border border-transparent rounded-xl"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  <span>Creating Your Profile...</span>
                </>
              ) : (
                <>
                  <div className="p-1 bg-white/20 rounded-full">
                    <Save className="h-5 w-5" />
                  </div>
                  <span>Create Provider Profile</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-6 flex items-center justify-center space-x-2">
          <div className="text-xs text-gray-400 flex items-center space-x-2">
            <Shield className="h-3 w-3" />
            <span>Secure SSL Encryption</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="text-xs text-gray-400 flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span>Instant Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
