import React from 'react';
import { XCircle } from 'lucide-react';
import Button from '../shared/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText: string;
  confirmButtonColor?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText,
  confirmButtonColor = 'bg-green-600 hover:bg-green-700'
}) => {
  if (!isOpen) return null;

  // Scrollable overlay with a capped panel: centred-only modals became unreachable on short screens (a landscape phone) - the buttons sat outside the viewport with nothing to scroll.
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-white/30 p-4 py-10 backdrop-blur-sm sm:items-center">
      <div className="my-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-500">{message}</p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className={confirmButtonColor}
            >
              {confirmButtonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
