import React from 'react';
import { FiUpload, FiX } from 'react-icons/fi';

interface ImagesSectionProps {
  images: File[];
  uploadedImageUrls: string[];
  previewImages: string[];
  isUploading: boolean;
  imagesError?: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

const ImagesSection: React.FC<ImagesSectionProps> = ({
  images,
  uploadedImageUrls,
  previewImages,
  isUploading,
  imagesError,
  fileInputRef,
  onFileChange,
  onRemoveImage,
}) => {
  return (
    <div className="pb-8 border-b border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
        <span>Service Images</span>
        <span className="text-red-500 ml-2">*</span>
        <span className="ml-4 text-sm font-normal text-gray-400">(Max 5 images, 5MB each)</span>
      </h2>

      {/* Upload Area */}
      <div className="mb-6 relative z-10">
        {isUploading ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-900">
              Uploading images to Amazon S3...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {images.length > 0 ? `Processing ${images.length} image(s)` : 'Please wait...'}
            </p>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          >
            {/* Glowing effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-orange-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <FiUpload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-orange-500 transition-colors duration-200 relative z-10" />
            <p className="mt-4 text-lg font-medium text-gray-900 relative z-10">
              Click to upload images
            </p>
            <p className="mt-2 text-sm text-gray-500 relative z-10">
              PNG, JPG, WEBP up to 5MB each
            </p>
            {images.length + uploadedImageUrls.length > 0 && (
              <p className="mt-2 text-sm text-gray-500 font-medium relative z-10">
                {images.length + uploadedImageUrls.length}/5 images selected
              </p>
            )}
          </div>
        )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
            aria-label="Upload service images"
          />
        {imagesError && <p className="mt-2 text-sm text-red-500 flex items-center">
          <FiX className="w-4 h-4 mr-1" />
          At least one image is required
        </p>}
      </div>

      {/* Image Previews */}
      {(images.length > 0 || previewImages.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-orange-300 transition-all duration-200">
                <img
                  src={previewImages[index] || URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                aria-label={`Remove image ${index + 1}`}
                title={`Remove image ${index + 1}`}
              >
                <FiX className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagesSection;
