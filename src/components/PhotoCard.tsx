import { useState, useEffect, useRef } from 'react';
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
      className="overflow-hidden relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fadeIn rounded-lg"
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
    </div>
  );
};

export default PhotoCard;
