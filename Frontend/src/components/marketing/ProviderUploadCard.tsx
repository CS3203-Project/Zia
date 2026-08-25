import { CheckCircle, Upload } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProviderUploadCardProps {
  icon: ReactNode;
  label: string;
  inputId: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  inputTitle: string;
  dropzoneTitle: string;
  dropzoneSubtitle: string;
  uploading: boolean;
  uploadingLabel: string;
  uploadedUrl?: string;
  footerHint: string;
}

export default function ProviderUploadCard({
  icon,
  label,
  inputId,
  onChange,
  disabled,
  inputTitle,
  dropzoneTitle,
  dropzoneSubtitle,
  uploading,
  uploadingLabel,
  uploadedUrl,
  footerHint
}: ProviderUploadCardProps) {
  return (
    <div className="space-y-4 pb-8 border-b border-gray-100">
      <label className="flex items-center text-lg font-bold text-gray-900">
        <div className="p-2 bg-orange-50 rounded-lg mr-3">
          {icon}
        </div>
        {label}
      </label>

      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={onChange}
          className="hidden"
          id={inputId}
          disabled={disabled}
          title={inputTitle}
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer flex flex-col items-center justify-center w-full px-6 py-12 border-2 border-dashed border-gray-300 rounded-2xl hover:border-orange-400 transition-all duration-200 bg-gray-50"
        >
          <div className="p-4 bg-orange-100 rounded-full mb-4">
            <Upload className="h-8 w-8 text-orange-600" />
          </div>
          <div className="text-center">
            <p className="text-gray-900 font-medium mb-2">{dropzoneTitle}</p>
            <p className="text-gray-500 text-sm">{dropzoneSubtitle}</p>
          </div>
        </label>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="flex items-center space-x-3 text-white">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-400 border-t-transparent"></div>
              <span className="font-medium">{uploadingLabel}</span>
            </div>
          </div>
        )}

        {uploadedUrl && !uploading && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-2 rounded-full">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Uploaded</span>
          </div>
        )}
      </div>

      <p className="text-gray-500 text-sm">
        {footerHint}
      </p>
    </div>
  );
}
