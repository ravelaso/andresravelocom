import React, { useState, useEffect, useRef } from 'react';
import type { GalleryImage } from '@/lib/useGallery';

interface PhotoCardProps {
  image: GalleryImage;
  onClick: () => void;
  style?: React.CSSProperties;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ image, onClick, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !inView) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [inView]);

  return (
    <div
      ref={imgRef}
      className="overflow-hidden relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fadeIn rounded-lg"
      onClick={onClick}
      style={style}
    >
      {!loaded && !error && (
        <div className="placeholder bg-gray-800 animate-pulse aspect-square rounded-lg" />
      )}

      {error && (
        <div className="flex items-center justify-center h-full text-red-400 bg-gray-800 rounded-lg p-8">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {inView && (
        <img
          src={image.url}
          alt={image.title}
          className={`w-full h-auto object-cover rounded-lg transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex flex-col justify-end p-4">
        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {image.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white"
              >
                {tag}
              </span>
            ))}
            {image.tags.length > 4 && (
              <span className="text-xs px-2 py-0.5 text-gray-300">
                +{image.tags.length - 4}
              </span>
            )}
          </div>
        )}

        <h3 className="text-white font-semibold text-sm truncate">{image.title}</h3>

        {(image.camera || image.film) && (
          <p className="text-gray-300 text-xs mt-0.5">
            {[image.camera, image.film].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
};

export default PhotoCard;
