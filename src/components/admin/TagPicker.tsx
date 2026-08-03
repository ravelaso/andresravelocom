import { useState } from 'react';
import type { AdminPhoto } from '@/types/admin';

interface TagPickerProps {
  tag: string;
  photos: AdminPhoto[];
  onSave: (tag: string, addedKeys: string[], removedKeys: string[]) => Promise<void>;
  onClose: () => void;
}

export default function TagPicker({ tag, photos, onSave, onClose }: TagPickerProps) {
  const [taggedKeys, setTaggedKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const p of photos) {
      if (p.meta?.tags?.includes(tag)) initial.add(p.key);
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const togglePhoto = (key: string) => {
    setTaggedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const addedKeys: string[] = [];
      const removedKeys: string[] = [];
      for (const p of photos) {
        const tagged = taggedKeys.has(p.key);
        const current = p.meta?.tags?.includes(tag) ?? false;
        if (tagged && !current) addedKeys.push(p.key);
        else if (!tagged && current) removedKeys.push(p.key);
      }
      await onSave(tag, addedKeys, removedKeys);
    } finally {
      setSaving(false);
    }
  };

  const filteredPhotos = photos.filter(
    (p) =>
      !search ||
      p.key.toLowerCase().includes(search.toLowerCase()) ||
      p.meta?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const addedCount = filteredPhotos.filter((p) => taggedKeys.has(p.key) && !p.meta?.tags?.includes(tag)).length;
  const removedCount = filteredPhotos.filter((p) => !taggedKeys.has(p.key) && p.meta?.tags?.includes(tag)).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-neutral-900 rounded-2xl w-full max-w-2xl border border-gray-800 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <h2 className="font-semibold">Tag photos — <span className="text-blue-400">{tag}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search photos..."
            className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Photos ({taggedKeys.size} tagged) — click to toggle
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
              {filteredPhotos.map((photo) => {
                const selected = taggedKeys.has(photo.key);
                return (
                  <button
                    key={photo.key}
                    onClick={() => togglePhoto(photo.key)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-transparent hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.meta?.title ?? photo.key}
                      className="w-full h-full object-cover"
                    />
                    {selected && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (addedCount === 0 && removedCount === 0)}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : addedCount || removedCount
              ? `Apply (${addedCount ? `+${addedCount}` : ''}${addedCount && removedCount ? ' / ' : ''}${removedCount ? `-${removedCount}` : ''})`
              : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
