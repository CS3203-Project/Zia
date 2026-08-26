import React from 'react';
import { toPlainText } from '../../../utils/richText';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface ServiceHeroGalleryProps {
  images: string[];
  selectedImage: number;
  title: string;
  description?: string;
  categoryName?: string;
  onPrevImage: () => void;
  onNextImage: () => void;
}

/**
 * Hero image banner at the top of the left column: the currently selected
 * photo with a category badge, image counter, title/description overlay,
 * and prev/next navigation arrows.
 */
const ServiceHeroGallery: React.FC<ServiceHeroGalleryProps> = ({
  images,
  selectedImage,
  title,
  description,
  categoryName,
  onPrevImage,
  onNextImage
}) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-md group">
      <div className="h-44 sm:h-56 md:h-64 relative bg-gray-100">
        <img
          src={images[selectedImage]}
          alt={title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
      </div>

      {/* Category badge */}
      {categoryName && (
        <div className="absolute top-3 left-3">
          <span className="bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {categoryName}
          </span>
        </div>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-white/90 backdrop-blur-md rounded-full px-2.5 py-1 shadow-sm">
          <Eye className="w-3 h-3 text-gray-600" />
          <span className="text-gray-700 text-xs font-medium">
            {selectedImage + 1}/{images.length}
          </span>
        </div>
      )}

      {/* Title overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 drop-shadow-md line-clamp-1">
          {title}
        </h1>
        {description && (
          <p className="text-white/90 text-xs sm:text-sm max-w-2xl line-clamp-1">
            {toPlainText(description)}
          </p>
        )}
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={onPrevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-md rounded-full text-gray-700 hover:bg-white transition-all duration-300 hover:scale-110 shadow-sm"
            title="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-md rounded-full text-gray-700 hover:bg-white transition-all duration-300 hover:scale-110 shadow-sm"
            title="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

export default ServiceHeroGallery;
