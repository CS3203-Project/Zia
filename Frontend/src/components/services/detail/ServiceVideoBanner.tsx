import React from 'react';
import { Eye, Heart, Bookmark } from 'lucide-react';
import { cn } from '../../../utils/utils';

interface ServiceVideoBannerProps {
  videoUrl: string;
  isVideoPlaying: boolean;
  onVideoPlay: () => void;
  onVideoPause: () => void;
  onVideoEnded: () => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}

/**
 * Full-width demo video shown above the main content grid, with a
 * "playing/demo" badge and floating wishlist/bookmark actions.
 */
const ServiceVideoBanner: React.FC<ServiceVideoBannerProps> = ({
  videoUrl,
  isVideoPlaying,
  onVideoPlay,
  onVideoPause,
  onVideoEnded,
  isWishlisted,
  onToggleWishlist
}) => {
  return (
    <div className="-mx-4 mb-8 bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 group">
      <div className="relative bg-gradient-to-br from-white via-gray-100 to-white">
        <video
          autoPlay
          muted
          playsInline
          loop
          className="w-full max-h-[60vh] object-cover"
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

        {/* Floating Action Buttons with Glass Morphism */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={onToggleWishlist}
            className={cn(
              "p-3 rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-110 shadow-lg",
              isWishlisted
                ? 'bg-orange-500 text-white border-orange-500/10'
                : 'bg-white/70 text-gray-900 border-white/5 hover:bg-white'
            )}
            title="Add to wishlist"
          >
            <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
          </button>
          <button
            className="p-3 rounded-full bg-white/70 backdrop-blur-md border border-white/5 text-gray-900 hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg"
            title="Bookmark service"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceVideoBanner;
