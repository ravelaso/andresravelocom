import React, { useState, useEffect, useRef } from 'react';
import { useGallery, type GalleryImage } from '@/lib/useGallery';
import type { ApiResponseData } from '@/lib/useGallery';
import PhotoFilter from './PhotoFilter';
import FeaturedCarousel from './FeaturedCarousel';
import MasonryGrid from './MasonryGrid';
import PhotoModal from './PhotoModal';

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

  const [modalImages, setModalImages] = useState<GalleryImage[] | null>(null);
  const [modalIndex, setModalIndex] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
      setModalImages(images);
      setModalIndex(idx);
    } else {
      idx = featuredPhotos.findIndex((i) => i.key === img.key);
      if (idx >= 0) {
        setModalImages(featuredPhotos);
        setModalIndex(idx);
      }
    }
    document.body.style.overflow = 'hidden';
  };

  const goNext = () => {
    if (!modalImages) return;
    if (modalIndex < modalImages.length - 1) {
      setModalIndex(modalIndex + 1);
    }
  };

  const goPrev = () => {
    if (!modalImages) return;
    if (modalIndex > 0) {
      setModalIndex(modalIndex - 1);
    }
  };

  const closeModal = () => {
    setModalImages(null);
    document.body.style.overflow = '';
  };

  const current = modalImages ? modalImages[modalIndex] : null;
  const isFirst = modalIndex === 0;
  const isLast = modalImages ? modalIndex === modalImages.length - 1 : true;

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

          <MasonryGrid images={images} onImageClick={openModal} />
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

      {modalImages && current && (
        <PhotoModal
          image={current}
          index={modalIndex}
          total={modalImages.length}
          isFirst={isFirst}
          isLast={isLast}
          onClose={closeModal}
          onNext={goNext}
          onPrev={goPrev}
        />
      )}
    </>
  );
};

export default PhotoGallery;
