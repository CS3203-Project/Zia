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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/80 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-2xl w-full max-w-md">
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
