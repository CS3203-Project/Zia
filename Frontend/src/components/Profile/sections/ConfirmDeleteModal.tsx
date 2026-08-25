import { AlertTriangle } from 'lucide-react';
import Button from '../../shared/Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  // See ConfirmationModal: centred-only modals strand their buttons off-screen on a short viewport.
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-white/30 p-4 py-10 backdrop-blur-sm sm:items-center">
      <div className="my-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-100 bg-white/80 shadow-2xl backdrop-blur-lg">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-500/20 backdrop-blur-sm rounded-full border border-red-400/30">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-400 mb-6">
            {message}
          </p>
          <div className="flex space-x-3">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white border border-red-400/30"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
