import { useState, useEffect, useRef, useCallback } from 'react';

export interface GalleryImage {
  key: string;
  url: string;
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

export interface CollectionBrief {
  slug: string;
  title: string;
  photoCount: number;
}

export interface GalleryFilters {
  tags: string[];
  collection: string | null;
}

export interface ApiResponseData {
  images: GalleryImage[];
  hasMore: boolean;
  cursor: string | null;
  total: number;
  tags: string[];
  collections: CollectionBrief[];
  featured: GalleryImage[];
}

export function useGallery(initialData?: Partial<ApiResponseData>) {
  const [images, setImages] = useState<GalleryImage[]>(initialData?.images ?? []);
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? false);
  const [cursor, setCursor] = useState<string | null>(initialData?.cursor ?? null);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [availableTags, setAvailableTags] = useState<string[]>(initialData?.tags ?? []);
  const [availableCollections, setAvailableCollections] = useState<CollectionBrief[]>(initialData?.collections ?? []);
  const [featuredPhotos, setFeaturedPhotos] = useState<GalleryImage[]>(initialData?.featured ?? []);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<GalleryFilters>({ tags: [], collection: null });

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!initialData?.images?.length && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchWithFilters({ tags: [], collection: null }, null, false);
    }
  }, []);

  const fetchWithFilters = useCallback(async (f: GalleryFilters, pageCursor: string | null, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '12' });
      if (pageCursor) params.set('offset', pageCursor);
      f.tags.forEach(t => params.append('tag', t));
      if (f.collection) params.set('collection', f.collection);

      const res = await fetch(`/api/photos?${params}`);
      const data: ApiResponseData = await res.json();

      setImages(prev => append ? [...prev, ...(data.images ?? [])] : (data.images ?? []));
      setHasMore(data.hasMore ?? false);
      setCursor(data.cursor ?? null);
      setTotal(data.total ?? 0);
      if (data.tags) setAvailableTags(data.tags);
      if (data.collections) setAvailableCollections(data.collections);
      if (data.featured) setFeaturedPhotos(data.featured);
    } catch (e) {
      console.error('Failed to load photos', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleTag = useCallback((tag: string) => {
    const current = filtersRef.current;
    const exists = current.tags.includes(tag);
    const newTags = exists ? current.tags.filter(t => t !== tag) : [...current.tags, tag];
    const newFilters = { ...current, tags: newTags };
    setFilters(newFilters);
    fetchWithFilters(newFilters, null, false);
  }, [fetchWithFilters]);

  const setCollection = useCallback((slug: string | null) => {
    const current = filtersRef.current;
    const newFilters = { ...current, collection: slug };
    setFilters(newFilters);
    fetchWithFilters(newFilters, null, false);
  }, [fetchWithFilters]);

  const clearFilters = useCallback(() => {
    setFilters({ tags: [], collection: null });
    fetchWithFilters({ tags: [], collection: null }, null, false);
  }, [fetchWithFilters]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore || !cursor) return;
    fetchWithFilters(filtersRef.current, cursor, true);
  }, [loading, hasMore, cursor, fetchWithFilters]);

  return {
    images,
    featuredPhotos,
    hasMore,
    total,
    loading,
    availableTags,
    availableCollections,
    filters,
    toggleTag,
    setCollection,
    loadMore,
    clearFilters,
    hasFilters: filters.tags.length > 0 || filters.collection !== null,
  };
}
