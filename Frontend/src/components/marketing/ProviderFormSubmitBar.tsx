import { Save } from 'lucide-react';
import Button from '../shared/Button';

interface ProviderFormSubmitBarProps {
  onCancel: () => void;
  loading: boolean;
  uploadingLogo: boolean;
  uploadingId: boolean;
}

export default function ProviderFormSubmitBar({ onCancel, loading, uploadingLogo, uploadingId }: ProviderFormSubmitBarProps) {
  return (
    <div className="pt-8 border-t border-gray-100 px-8 pb-8">
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading || uploadingLogo || uploadingId}
          className="min-w-[220px] flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Create Provider Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
