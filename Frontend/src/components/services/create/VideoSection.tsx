import React from 'react';
import { FiEye, FiUpload, FiX } from 'react-icons/fi';

interface VideoSectionProps {
  video: File | null;
  uploadedVideoUrl: string;
  isUploading: boolean;
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: () => void;
}

const VideoSection: React.FC<VideoSectionProps> = ({
  video,
  uploadedVideoUrl,
  isUploading,
  onVideoChange,
  onRemoveVideo,
}) => {
  return (
    <div className="pb-8 border-b border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
        <span>Service Video</span>
        <span className="ml-4 text-sm font-normal text-gray-400">(Optional, Max 100MB)</span>
      </h2>

      {/* Video Upload Area */}
      <div className="mb-6 relative z-10">
        {isUploading ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-900">
              Uploading video to Amazon S3...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Please wait while your video is being uploaded...
            </p>
          </div>
        ) : !video && !uploadedVideoUrl ? (
          <div
            onClick={() => document.getElementById('video-upload')?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          >
            {/* Glowing effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-orange-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <input
              type="file"
              accept="video/*"
              onChange={onVideoChange}
              className="hidden"
              id="video-upload"
              aria-label="Upload service video"
            />

            <FiUpload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-orange-500 transition-colors duration-200 relative z-10" />
            <p className="mt-4 text-lg font-medium text-gray-900 relative z-10">
              Click to upload a service video
            </p>
            <p className="mt-2 text-sm text-gray-500 relative z-10">
              MP4, WebM, MOV up to 100MB
            </p>
            <p className="mt-1 text-xs text-gray-400 relative z-10">
              A short video showcasing your service (optional)
            </p>
          </div>
        ) : (
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg flex items-center justify-center shadow-lg">
                  <FiEye className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {video ? video.name : 'Uploaded Video'}
                  </p>
                  <p className="text-sm text-gray-500">
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
                <FiX className="w-5 h-5" />
              </button>
            </div>
            {video && (
              <div className="mt-4">
                <video
                  controls
                  className="w-full max-w-md h-48 bg-black/80 rounded-lg border border-gray-200"
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

export default VideoSection;
