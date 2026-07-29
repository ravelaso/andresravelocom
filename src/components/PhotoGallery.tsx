import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGallery, type GalleryImage } from '@/lib/useGallery';
import type { ApiResponseData } from '@/lib/useGallery';
import PhotoCard from './PhotoCard';
import PhotoFilter from './PhotoFilter';
import FeaturedCarousel from './FeaturedCarousel';

interface PhotoGalleryProps {
  initialData: ApiResponseData;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ initialData }) => {
  const {
    images,
    featuredPhotos,
    hasMore,
    loading,
    availableTags,
    availableCollections,
    filters,
    toggleTag,
    setCollection,
    loadMore,
    clearFilters,
    hasFilters,
  } = useGallery(initialData);

  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [columns, setColumns] = useState(4);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth;
      if (w < 640) setColumns(1);
      else if (w < 768) setColumns(2);
      else if (w < 1024) setColumns(3);
      else if (w < 1280) setColumns(4);
      else setColumns(5);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const imageColumns = useCallback<(list: GalleryImage[]) => GalleryImage[][]>(
    (list) => {
      const cols: GalleryImage[][] = Array.from({ length: columns }, () => []);
      list.forEach((img, i) => cols[i % columns].push(img));
      return cols;
    },
    [columns],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const openModal = (url: string) => {
    setModalImage(url);
    setModalLoading(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalImage(null);
    setModalLoading(false);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalImage) closeModal();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalImage]);

  const cols = imageColumns(images);

  return (
    <>
      <div className="lg:flex lg:gap-6 lg:px-5">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-56 shrink-0">
          <PhotoFilter
            availableTags={availableTags}
            availableCollections={availableCollections}
            activeFilters={filters}
            onToggleTag={toggleTag}
            onSelectCollection={setCollection}
            onClear={clearFilters}
            variant="sidebar"
          />
        </div>

        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter bar */}
          <div className="lg:hidden">
            <PhotoFilter
              availableTags={availableTags}
              availableCollections={availableCollections}
              activeFilters={filters}
              onToggleTag={toggleTag}
              onSelectCollection={setCollection}
              onClear={clearFilters}
              variant="collapsible"
            />
          </div>

          {/* Featured carousel */}
          {!hasFilters && featuredPhotos.length > 0 && (
            <FeaturedCarousel images={featuredPhotos} onImageClick={openModal} />
          )}

          {/* Masonry grid */}
          <div className="flex gap-3 p-5">
            {cols.map((col, ci) => (
              <div key={ci} className="flex-1 flex flex-col gap-3">
                {col.map((img, ii) => (
                  <PhotoCard
                    key={img.key}
                    image={img}
                    onClick={() => openModal(img.url)}
                    style={{ animationDelay: `${(ii * columns + ci) * 0.1}s` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
          <p className="text-gray-400 mt-2">Loading more images...</p>
        </div>
      )}

      {!loading && images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>
            {hasFilters
              ? 'No images match the selected filters.'
              : 'No images found.'}
          </p>
        </div>
      )}

      {!hasMore && images.length > 0 && !hasFilters && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end of the gallery!</p>
        </div>
      )}

      <div ref={sentinelRef} className="h-20" />

      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="relative max-w-5xl w-full rounded-xl overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-70 hover:bg-red-600 rounded-full w-10 h-10 flex items-center justify-center z-10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center justify-center min-h-[200px]">
              <img
                src={modalImage}
                alt="Full size image"
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
                onLoad={() => setModalLoading(false)}
              />
              {modalLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
