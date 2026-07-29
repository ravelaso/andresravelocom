import React from 'react';
import type { GalleryImage } from '@/lib/useGallery';

interface FeaturedCarouselProps {
  images: GalleryImage[];
  onImageClick: (image: GalleryImage) => void;
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ images, onImageClick }) => {
  return (
    <div className="px-5 pt-5">
      <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <span className="text-amber-400">★</span>
        Highlights
      </h2>
      <div
        className="flex gap-3 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {images.map((img) => (
          <button
            key={img.key}
            onClick={() => onImageClick(img)}
            className="snap-start shrink-0 w-48 group cursor-pointer text-left"
          >
            <div className="overflow-hidden rounded-xl aspect-[3/2] bg-gray-800">
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <p className="text-sm text-gray-300 mt-1.5 truncate">{img.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCarousel;
