import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '../../../utils/utils';

interface ServicePhotoGalleryProps {
  images: string[];
  title: string;
  selectedImage: number;
  onSelectImage: (index: number) => void;
}

/**
 * "Photos" card: a row of thumbnails (when there's more than one image)
 * above a large preview of the currently selected photo.
 */
const ServicePhotoGallery: React.FC<ServicePhotoGalleryProps> = ({
  images,
  title,
  selectedImage,
  onSelectImage
}) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-orange-500" />
        Photos
        <span className="text-gray-400 font-normal text-sm">({images.length})</span>
      </h2>

      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => onSelectImage(index)}
              className={cn(
                "flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200",
                selectedImage === index
                  ? 'border-orange-500 ring-2 ring-orange-200'
                  : 'border-transparent opacity-70 hover:opacity-100'
              )}
              title={`View photo ${index + 1}`}
            >
              <img src={image} alt={`${title} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="w-full h-72 sm:h-96 md:h-[28rem] rounded-2xl overflow-hidden bg-gray-100">
        <img
          src={images[selectedImage]}
          alt={`${title} - photo ${selectedImage + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default ServicePhotoGallery;
