import React from 'react';

interface PhotoMeta {
  title: string;
  description?: string;
  tags: string[];
  camera?: string;
  lens?: string;
  film?: string;
  date?: string;
  location?: string;
  featured: boolean;
  forSale: boolean;
}

interface AdminPhoto {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  meta: PhotoMeta | null;
}

interface Collection {
  title: string;
  photos: string[];
}

interface PhotoGridProps {
  photos: AdminPhoto[];
  collections: Record<string, Collection>;
  onSelect: (photo: AdminPhoto) => void;
}

export default function PhotoGrid({ photos, collections, onSelect }: PhotoGridProps) {
  if (!photos.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No photos found.
      </div>
    );
  }

  const photoCollections = (key: string): string[] => {
    return Object.entries(collections)
      .filter(([_, c]) => c.photos.includes(key))
      .map(([slug]) => slug);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {photos.map((photo) => {
        const inCollections = photoCollections(photo.key);
        return (
          <button
            key={photo.key}
            onClick={() => onSelect(photo)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-gray-800 hover:border-gray-600 transition-all text-left"
          >
            <img
              src={photo.url}
              alt={photo.meta?.title ?? photo.key}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <p className="text-sm font-medium truncate">
                {photo.meta?.title ?? photo.key}
              </p>
              {photo.meta?.tags && photo.meta.tags.length > 0 && (
                <p className="text-xs text-gray-300 truncate mt-1">
                  {photo.meta.tags.join(', ')}
                </p>
              )}
              {inCollections.length > 0 && (
                <p className="text-xs text-blue-400 truncate">
                  {inCollections.join(', ')}
                </p>
              )}
            </div>

            {photo.meta?.featured && (
              <span className="absolute top-2 left-2 px-2 py-0.5 text-xs bg-yellow-500 text-black rounded-full font-medium">
                Featured
              </span>
            )}

            {!photo.meta && (
              <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-red-500/80 text-white rounded-full">
                No meta
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
