import { useState, useEffect, useRef } from 'react';
import type { GalleryImage } from '@/lib/useGallery';
import PhotoModalNavBar from './PhotoModalNavBar';
import PhotoModalMetadata from './PhotoModalMetadata';

interface PhotoModalProps {
  image: GalleryImage;
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({
  image, index, total, isFirst, isLast, onClose, onNext, onPrev,
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [image.key]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const onPrevRef = useRef(onPrev);
  onPrevRef.current = onPrev;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'ArrowRight') onNextRef.current();
      if (e.key === 'ArrowLeft') onPrevRef.current();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" onClick={onClose}>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <img
          src={image.url}
          alt={image.title}
          className="max-w-full max-h-full object-contain rounded-xl"
          onClick={(e) => e.stopPropagation()}
          onLoad={() => setLoading(false)}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 border-4 border-white border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <PhotoModalNavBar
          isFirst={isFirst}
          isLast={isLast}
          onPrev={onPrev}
          onNext={onNext}
          onClose={onClose}
        />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <PhotoModalMetadata
          image={image}
          index={index}
          total={total}
        />
      </div>
    </div>
  );
};

export default PhotoModal;
