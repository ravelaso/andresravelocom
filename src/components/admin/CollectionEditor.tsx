import React, { useState } from 'react';

interface PhotoMeta {
  title: string | null;
  [key: string]: any;
}

interface AdminPhoto {
  key: string;
  url: string;
  meta: PhotoMeta | null;
}

interface Collection {
  title: string;
  description?: string;
  coverPhoto?: string;
  photos: string[];
}

interface CollectionEditorProps {
  slug: string | null;
  data: Collection | null;
  photos: AdminPhoto[];
  onSave: (slug: string, data: Collection) => Promise<void>;
  onClose: () => void;
}

export default function CollectionEditor({ slug, data, photos, onSave, onClose }: CollectionEditorProps) {
  const isNew = !slug;
  const [form, setForm] = useState<{ slug: string; title: string; description: string }>({
    slug: slug ?? '',
    title: data?.title ?? '',
    description: data?.description ?? '',
  });
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>(data?.photos ?? []);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const togglePhoto = (key: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(form.slug, {
        title: form.title,
        description: form.description,
        photos: selectedPhotos,
      });
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-neutral-900 rounded-2xl w-full max-w-2xl border border-gray-800 max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <h2 className="font-semibold">{isNew ? 'New Collection' : `Edit: ${data?.title}`}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                disabled={!isNew}
                className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Photos ({selectedPhotos.length} selected)
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search photos..."
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-3"
            />
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
              {filteredPhotos.map((photo) => {
                const selected = selectedPhotos.includes(photo.key);
                return (
                  <button
                    key={photo.key}
                    onClick={() => togglePhoto(photo.key)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-transparent hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.meta?.title ?? photo.key}
                      className="w-full h-full object-cover"
                    />
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
            disabled={saving || !form.title.trim()}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}
