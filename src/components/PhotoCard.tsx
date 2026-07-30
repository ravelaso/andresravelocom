import { useState } from 'react';
import type { GalleryImage } from '@/lib/useGallery';

interface PhotoCardProps {
  image: GalleryImage;
  onClick: () => void;
  style?: React.CSSProperties;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ image, onClick, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className="overflow-hidden relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fadeIn rounded-lg bg-gray-800"
      onClick={onClick}
      style={style}
    >
      {error ? (
        <div className="flex items-center justify-center text-red-400 w-full h-full p-4">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      ) : (
        <img
          src={image.url}
          alt={image.title}
          className={`w-full h-full object-cover rounded-lg transition-all duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export default PhotoCard;
