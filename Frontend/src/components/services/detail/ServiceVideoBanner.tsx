import React from 'react';
import { Eye } from 'lucide-react';

interface ServiceVideoBannerProps {
  videoUrl: string;
  isVideoPlaying: boolean;
  onVideoPlay: () => void;
  onVideoPause: () => void;
  onVideoEnded: () => void;
}

/**
 * Full-width demo video shown above the main content grid, with a
 * "playing/demo" badge.
 */
const ServiceVideoBanner: React.FC<ServiceVideoBannerProps> = ({
  videoUrl,
  isVideoPlaying,
  onVideoPlay,
  onVideoPause,
  onVideoEnded
}) => {
  return (
    <div className="-mx-4 mb-8 bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 group">
      {/* A fixed 16:9 frame the video fills. Previously the <video> carried the
          sizing itself (w-full max-h-[60vh]), so its height came from the file's
          own aspect ratio: any clip that wasn't 16:9 left the frame taller or
          shorter than its content and the picture sat off to one side. Giving the
          wrapper the shape and letting the video cover it keeps the crop centred
          whatever the source dimensions are. */}
      <div className="relative w-full aspect-video max-h-[60vh] bg-black">
        <video
          autoPlay
          muted
          playsInline
          loop
          className="absolute inset-0 h-full w-full object-cover object-center"
          onPlay={onVideoPlay}
          onEnded={onVideoEnded}
          onPause={onVideoPause}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
        </video>

        {/* Dark overlay for video */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40"></div>

        {/* Video indicator badge */}
        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20">
          <div className="flex items-center text-white text-sm font-medium">
            <Eye className="w-4 h-4 mr-2" />
            {isVideoPlaying ? 'Playing' : 'Demo Video'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceVideoBanner;
