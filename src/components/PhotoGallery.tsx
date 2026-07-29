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

  const [modalState, setModalState] = useState<{
    images: GalleryImage[];
    index: number;
  } | null>(null);
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

  const openModal = (img: GalleryImage) => {
    let idx = images.findIndex((i) => i.key === img.key);
    if (idx >= 0) {
      setModalState({ images, index: idx });
    } else {
      idx = featuredPhotos.findIndex((i) => i.key === img.key);
      if (idx >= 0) {
        setModalState({ images: featuredPhotos, index: idx });
      }
    }
    setModalLoading(true);
    document.body.style.overflow = 'hidden';
  };

  const goNext = () => {
    if (!modalState) return;
    if (modalState.index < modalState.images.length - 1) {
      setModalLoading(true);
      setModalState({ ...modalState, index: modalState.index + 1 });
    }
  };

  const goPrev = () => {
    if (!modalState) return;
    if (modalState.index > 0) {
      setModalLoading(true);
      setModalState({ ...modalState, index: modalState.index - 1 });
    }
  };

  const closeModal = () => {
    setModalState(null);
    setModalLoading(false);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    if (!modalState) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalState]);

  const current = modalState ? modalState.images[modalState.index] : null;
  const isFirst = modalState ? modalState.index === 0 : true;
  const isLast = modalState ? modalState.index === modalState.images.length - 1 : true;

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
                    onClick={() => openModal(img)}
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

      {/* Modal */}
      {modalState && current && (
        <div
          className="fixed inset-0 bg-black z-50 flex flex-col"
          onClick={closeModal}
        >
          {/* Nav bar */}
          <div
            className="flex items-center justify-between px-4 h-14 shrink-0 bg-black/60 border-b border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={goPrev}
              disabled={isFirst}
              className={`flex items-center gap-1.5 text-sm font-medium rounded-full px-4 py-1.5 transition-colors ${
                isFirst
                  ? 'text-gray-700 bg-transparent cursor-default'
                  : 'text-gray-200 bg-white/10 hover:bg-white/20'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <button
              onClick={closeModal}
              className="text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={goNext}
              disabled={isLast}
              className={`flex items-center gap-1.5 text-sm font-medium rounded-full px-4 py-1.5 transition-colors ${
                isLast
                  ? 'text-gray-700 bg-transparent cursor-default'
                  : 'text-gray-200 bg-white/10 hover:bg-white/20'
              }`}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Image + metadata centered */}
          <div className="flex-1 flex flex-col mx-auto max-w-5xl w-full min-h-0">
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              <img
                src={current.url}
                alt={current.title}
                className="max-w-full max-h-full object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
                onLoad={() => setModalLoading(false)}
              />
              {modalLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 border-4 border-white border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Metadata panel */}
            <div
              className="shrink-0 bg-black/80 border-t border-gray-800 px-6 py-4"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-white font-semibold text-base truncate">
                  {current.title}
                </h2>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1.5">
                  {current.camera && (
                    <span>📷 {current.camera}</span>
                  )}
                  {current.film && (
                    <span>🎞️ {current.film}</span>
                  )}
                  {current.lens && (
                    <span>🔭 {current.lens}</span>
                  )}
                  {current.location && (
                    <span>📍 {current.location}</span>
                  )}
                  {current.date && (
                    <span>📅 {current.date}</span>
                  )}
                </div>

                {current.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {current.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-0.5 bg-white/10 text-gray-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <span className="shrink-0 text-sm text-gray-500 mt-1">
                {modalState.index + 1} of {modalState.images.length}
              </span>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default PhotoGallery;
