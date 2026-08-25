import React from 'react';
import { FiUpload, FiX, FiStar, FiEye } from 'react-icons/fi';

interface ImagesSectionProps {
  images: File[];
  uploadedImageUrls: string[];
  previewImages: string[];
  isUploading: boolean;
  imagesError?: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onSetThumbnail: (index: number) => void;
  video: File | null;
  uploadedVideoUrl: string;
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: () => void;
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
  onSetThumbnail,
  video,
  uploadedVideoUrl,
  onVideoChange,
  onRemoveVideo,
}) => {
  return (
    <div className="pb-8 border-b border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
        <span>Photos & Video</span>
        <span className="text-red-500 ml-2">*</span>
        <span className="ml-4 text-sm font-normal text-gray-400">(Max 5 photos, 5MB each · video optional, up to 100MB)</span>
      </h2>

      {/* Upload Area */}
      <div className="mb-6 relative z-10">
        {isUploading ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-900">
              Uploading to Amazon S3...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {images.length > 0 ? `Processing ${images.length} image(s)` : 'Please wait...'}
            </p>
          </div>
        ) : (
          <label
            htmlFor="images-upload"
            className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          >
            <FiUpload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-orange-500 transition-colors duration-200" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              Click to upload photos
            </p>
            <p className="mt-2 text-sm text-gray-500">
              PNG, JPG, WEBP up to 5MB each
            </p>
            {images.length + uploadedImageUrls.length > 0 && (
              <p className="mt-2 text-sm text-gray-500 font-medium">
                {images.length + uploadedImageUrls.length}/5 photos selected
              </p>
            )}
          </label>
        )}
          <input
            ref={fileInputRef}
            id="images-upload"
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <div className={`aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 transition-all duration-200 ${
                index === 0 ? 'border-orange-400' : 'border-gray-200 hover:border-orange-300'
              }`}>
                <img
                  src={previewImages[index] || URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnail badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-orange-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow">
                  <FiStar className="w-3 h-3" />
                  Thumbnail
                </div>
              )}

              {/* Set as thumbnail */}
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => onSetThumbnail(index)}
                  className="absolute top-2 left-2 w-6 h-6 bg-white/90 text-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-orange-500 hover:text-white shadow"
                  aria-label={`Set image ${index + 1} as thumbnail`}
                  title="Set as thumbnail"
                >
                  <FiStar className="w-3 h-3" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="absolute top-2 right-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
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

      {/* Video */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          Service Video <span className="ml-2 text-xs font-normal text-gray-400">(Optional, Max 100MB)</span>
        </h3>

        {!video && !uploadedVideoUrl ? (
          <label
            htmlFor="video-upload"
            className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300 cursor-pointer group"
          >
            <input
              type="file"
              accept="video/*"
              onChange={onVideoChange}
              className="hidden"
              id="video-upload"
              aria-label="Upload service video"
            />
            <FiUpload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-orange-500 transition-colors duration-200" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              Click to upload a service video
            </p>
            <p className="mt-1 text-xs text-gray-500">
              MP4, WebM, MOV up to 100MB
            </p>
          </label>
        ) : (
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                  <FiEye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {video ? video.name : 'Uploaded Video'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {video
                      ? `${(video.size / (1024 * 1024)).toFixed(1)} MB`
                      : 'Video ready'
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemoveVideo}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                aria-label="Remove video"
                title="Remove video"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            {video && (
              <div className="mt-3">
                <video
                  controls
                  className="w-full max-w-md h-40 bg-black/80 rounded-lg border border-gray-200"
                  src={URL.createObjectURL(video)}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagesSection;
