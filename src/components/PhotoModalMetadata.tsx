import React from 'react';
import type { GalleryImage } from '@/lib/useGallery';

interface PhotoModalMetadataProps {
  image: GalleryImage;
  index: number;
  total: number;
}

const PhotoModalMetadata: React.FC<PhotoModalMetadataProps> = ({ image, index, total }) => (
  <div className="shrink-0 bg-ink/85 border-t border-line px-6 py-4">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {image.title.trim() && (
          <h2 className="text-paper font-semibold text-base truncate">{image.title}</h2>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted mt-1.5">
          {image.camera && <span>📷 {image.camera}</span>}
          {image.film && <span>🎞️ {image.film}</span>}
          {image.lens && <span>🔭 {image.lens}</span>}
          {image.location && <span>📍 {image.location}</span>}
          {image.date && <span>📅 {image.date}</span>}
        </div>

        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {image.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-0.5 bg-paper/10 text-body rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <span className="shrink-0 text-sm text-faint mt-1">
        {index + 1} of {total}
      </span>
    </div>
  </div>
);

export default PhotoModalMetadata;
