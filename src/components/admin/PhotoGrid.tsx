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
  selectedKeys: Set<string>;
  onSelect: (photo: AdminPhoto) => void;
  onToggleSelect: (key: string) => void;
}

export default function PhotoGrid({ photos, collections, selectedKeys, onSelect, onToggleSelect }: PhotoGridProps) {
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
        const isSelected = selectedKeys.has(photo.key);
        return (
          <div
            key={photo.key}
            onClick={() => onSelect(photo)}
            className={`group relative aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer ${
              isSelected
                ? 'border-blue-500 ring-2 ring-blue-500/40'
                : 'border-gray-800 hover:border-gray-600'
            }`}
          >
            <img
              src={photo.url}
              alt={photo.meta?.title ?? photo.key}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            <div
              className="absolute top-2 left-2 z-10"
              onClick={(e) => { e.stopPropagation(); onToggleSelect(photo.key); }}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-black/50 border-white/60 hover:bg-black/70'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
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
              <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-yellow-500 text-black rounded-full font-medium z-10">
                Featured
              </span>
            )}

            {!photo.meta && (
              <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-red-500/80 text-white rounded-full z-10">
                No meta
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
