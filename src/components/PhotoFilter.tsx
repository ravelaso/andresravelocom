import { useState, useRef, useEffect } from 'react';
import type { CollectionBrief, GalleryFilters } from '@/lib/useGallery';

interface PhotoFilterProps {
  availableTags: string[];
  availableCollections: CollectionBrief[];
  activeFilters: GalleryFilters;
  onToggleTag: (tag: string) => void;
  onSelectCollection: (slug: string | null) => void;
  onClear: () => void;
  variant?: 'sidebar' | 'collapsible';
}

function PhotoFilter({
  availableTags,
  availableCollections,
  activeFilters,
  onToggleTag,
  onSelectCollection,
  onClear,
  variant = 'sidebar',
}: PhotoFilterProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const hasFilters = activeFilters.tags.length > 0 || activeFilters.collection !== null;

  const activeTagCount = activeFilters.tags.length;
  const activeColLabel = activeFilters.collection
    ? availableCollections.find((c) => c.slug === activeFilters.collection)?.title
    : null;
  const totalActive = activeTagCount + (activeColLabel ? 1 : 0);

  if (variant === 'sidebar') {
    return (
      <aside className="sticky top-24">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Collections
        </h2>
        <ul className="space-y-0.5 mb-6">
          <li>
            <button
              onClick={() => onSelectCollection(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !activeFilters.collection
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Photos
            </button>
          </li>
          {availableCollections.map((col) => (
            <li key={col.slug}>
              <button
                onClick={() => onSelectCollection(col.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeFilters.collection === col.slug
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {col.title}
                <span className="text-xs text-gray-500 ml-2">({col.photoCount})</span>
              </button>
            </li>
          ))}
        </ul>

        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Tags
        </h2>
        <div className="space-y-0.5 mb-6">
          {availableTags.map((tag) => {
            const active = activeFilters.tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  active
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    active ? 'bg-white border-white' : 'border-gray-600'
                  }`}
                >
                  {active && (
                    <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {tag}
              </button>
            );
          })}
        </div>

        {hasFilters && (
          <button
            onClick={onClear}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Clear filters
          </button>
        )}
      </aside>
    );
  }

  return (
    <div ref={panelRef} className="border-b border-gray-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-5 py-3 text-sm text-gray-300 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {totalActive > 0 && (
          <span className="ml-1 text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-full">
            {totalActive}
          </span>
        )}
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-4">
          {availableCollections.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Collections</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                <button
                  onClick={() => { onSelectCollection(null); setOpen(false); }}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    !activeFilters.collection
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-gray-300 border-gray-600'
                  }`}
                >
                  All
                </button>
                {availableCollections.map((col) => (
                  <button
                    key={col.slug}
                    onClick={() => { onSelectCollection(col.slug); setOpen(false); }}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      activeFilters.collection === col.slug
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-gray-300 border-gray-600'
                    }`}
                  >
                    {col.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableTags.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Tags</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                {availableTags.map((tag) => {
                  const active = activeFilters.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => onToggleTag(tag)}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        active
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-gray-300 border-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasFilters && (
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PhotoFilter;
