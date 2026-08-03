import React, { useState, useEffect } from 'react';
import type { ApiResponseData, GalleryImage } from '@/lib/useGallery';

interface RecentImagesGridProps {
  count?: number;
  galleryHref?: string;
}

const RecentImagesGrid: React.FC<RecentImagesGridProps> = ({ count = 4, galleryHref = '/gallery' }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/photos?limit=10');
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = (await res.json()) as ApiResponseData;
        if (cancelled) return;
        const list = data.featured?.length ? data.featured : data.images;
        setImages((list || []).slice(0, count));
      } catch (e) {
        console.error('Error loading preview images:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [count]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 md:px-24 lg:px-32">
      {images.length
        ? images.map((img) => (
            <a
              key={img.key ?? img.url}
              href={galleryHref}
              className="group block overflow-hidden rounded-xl bg-surface-2 aspect-[3/2]"
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </a>
          ))
        : Array.from({ length: count }, (_, i) => (
            <div key={i} className="block overflow-hidden rounded-xl bg-surface-2 aspect-[3/2]" />
          ))}
    </div>
  );
};

export default RecentImagesGrid;
