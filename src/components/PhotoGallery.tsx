
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface PhotoObject {
    key: string;
    url: string;
    size: number;
    lastModified: string;
}

interface ApiResponse {
    images: PhotoObject[];
    hasMore: boolean;
    cursor: string | null;
}

interface PhotoGalleryProps {
    initialData: ApiResponse;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ initialData }) => {
    const [images, setImages] = useState<PhotoObject[]>(initialData.images);
    const [hasMore, setHasMore] = useState(initialData.hasMore);
    const [nextCursor, setNextCursor] = useState<string | null>(initialData.cursor);
    const [isLoading, setIsLoading] = useState(false);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [columns, setColumns] = useState(4);

    const galleryRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Responsive columns based on screen size
    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width < 640) setColumns(1);           // sm
            else if (width < 768) setColumns(2);      // md
            else if (width < 1024) setColumns(3);     // lg
            else if (width < 1280) setColumns(4);     // xl
            else setColumns(5);                       // 2xl
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    // Distribute images into columns
    const distributeImages = useCallback((imageList: PhotoObject[]) => {
        const columnArrays: PhotoObject[][] = Array(columns).fill(null).map(() => []);

        imageList.forEach((image, index) => {
            const columnIndex = index % columns;
            columnArrays[columnIndex].push(image);
        });

        return columnArrays;
    }, [columns]);

    const loadMoreImages = useCallback(async () => {
        if (isLoading || !hasMore || !nextCursor) return;

        setIsLoading(true);

        try {
            const url = `/api/photos?limit=12&cursor=${encodeURIComponent(nextCursor)}`;
            const response = await fetch(url);
            const data: ApiResponse = await response.json();

            if (data.images && data.images.length > 0) {
                setImages(prev => [...prev, ...data.images]);
                setHasMore(data.hasMore);
                setNextCursor(data.cursor);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more images:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, nextCursor]);

    // Setup infinite scroll
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && hasMore && !isLoading) {
                        loadMoreImages();
                    }
                });
            },
            { rootMargin: '200px' }
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [hasMore, isLoading, loadMoreImages]);

    const openModal = (imageUrl: string) => {
        setModalImage(imageUrl);
        setModalLoading(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setModalImage(null);
        setModalLoading(false);
        document.body.style.overflow = '';
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && modalImage) {
                closeModal();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [modalImage]);

    const imageColumns = distributeImages(images);

    return (
        <>
            {/* Gallery Grid - Flexbox Masonry */}
            <div ref={galleryRef} className="flex gap-3 p-5">
                {imageColumns.map((columnImages, columnIndex) => (
                    <div key={columnIndex} className="flex-1 flex flex-col gap-3">
                        {columnImages.map((image, imageIndex) => (
                            <PhotoItem
                                key={image.key}
                                image={image}
                                onClick={() => openModal(image.url)}
                                style={{
                                    animationDelay: `${(imageIndex * columns + columnIndex) * 0.1}s`
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Loading indicator */}
            {isLoading && (
                <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
                    <p className="text-gray-400 mt-2">Loading more images...</p>
                </div>
            )}

            {/* End of gallery message */}
            {!hasMore && images.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>You've reached the end of the gallery!</p>
                </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-20" />

            {/* Modal */}
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
                                    <div className="w-12 h-12 border-4 border-white border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Separate component for individual photo items with lazy loading
const PhotoItem: React.FC<{
    image: PhotoObject;
    onClick: () => void;
    style?: React.CSSProperties;
}> = ({ image, onClick, style }) => {
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
            { rootMargin: '50px' }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [inView]);

    return (
        <div
            ref={imgRef}
            className="overflow-hidden relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fadeIn rounded-lg"
            onClick={onClick}
            style={style}
        >
            {/* Placeholder */}
            {!loaded && (
                <div className="placeholder bg-gray-800 animate-pulse aspect-square rounded-lg">
                    {error && (
                        <div className="flex items-center justify-center h-full text-red-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>
            )}

            {/* Actual image - only load when in view */}
            {inView && (
                <img
                    src={image.url}
                    alt={image.key}
                    className={`w-full h-auto object-cover rounded-lg transition-opacity duration-300 ${
                        loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                    }`}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                    loading="lazy"
                />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-60 transition-opacity duration-300 flex items-center justify-center rounded-lg">
                <svg className="w-12 h-12 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
            </div>
        </div>
    );
};

export default PhotoGallery;