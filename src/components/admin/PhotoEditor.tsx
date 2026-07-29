import React, { useState } from 'react';

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
  meta: PhotoMeta | null;
}

interface Collection {
  title: string;
  photos: string[];
}

interface PhotoEditorProps {
  photo: AdminPhoto;
  collections: Record<string, Collection>;
  onSave: (key: string, data: Partial<PhotoMeta>) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onToggleCollection: (slug: string, add: boolean) => void;
  onClose: () => void;
}

export default function PhotoEditor({ photo, collections, onSave, onDelete, onToggleCollection, onClose }: PhotoEditorProps) {
  const [form, setForm] = useState<PhotoMeta>({
    title: photo.meta?.title ?? '',
    description: photo.meta?.description ?? '',
    tags: photo.meta?.tags ?? [],
    camera: photo.meta?.camera ?? '',
    lens: photo.meta?.lens ?? '',
    film: photo.meta?.film ?? '',
    date: photo.meta?.date ?? '',
    location: photo.meta?.location ?? '',
    featured: photo.meta?.featured ?? false,
    forSale: photo.meta?.forSale ?? false,
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChange = (field: keyof PhotoMeta, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(photo.key, form);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${photo.key}"? This removes it from R2 and all collections.`)) return;
    setDeleting(true);
    try {
      await onDelete(photo.key);
    } finally {
      setDeleting(false);
    }
  };

  const isInCollection = (slug: string) => collections[slug]?.photos.includes(photo.key);

  const toggleCollection = (slug: string) => {
    onToggleCollection(slug, !isInCollection(slug));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-end">
      <div className="w-full max-w-lg bg-neutral-900 h-full overflow-y-auto border-l border-gray-800">
        <div className="sticky top-0 bg-neutral-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold truncate">{photo.meta?.title || photo.key}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          <img src={photo.url} alt="" className="w-full rounded-lg" />

          <Field label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </Field>

          <Field label="Camera">
            <input
              type="text"
              value={form.camera}
              onChange={(e) => handleChange('camera', e.target.value)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Lens">
            <input
              type="text"
              value={form.lens}
              onChange={(e) => handleChange('lens', e.target.value)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Film">
            <input
              type="text"
              value={form.film}
              onChange={(e) => handleChange('film', e.target.value)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Location">
            <input
              type="text"
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={form.date ? form.date.slice(0, 10) : ''}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-700 rounded text-xs">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-white">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..."
                className="flex-1 bg-neutral-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
              />
              <button onClick={addTag} className="px-3 py-1.5 bg-neutral-700 rounded-lg text-sm hover:bg-neutral-600">
                Add
              </button>
            </div>
          </Field>

          <Field label="Collections">
            <div className="space-y-1.5">
              {Object.entries(collections).map(([slug, col]) => (
                <label key={slug} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInCollection(slug)}
                    onChange={() => toggleCollection(slug)}
                    className="rounded"
                  />
                  {col.title}
                </label>
              ))}
            </div>
          </Field>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => handleChange('featured', e.target.checked)}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.forSale}
                onChange={(e) => handleChange('forSale', e.target.checked)}
              />
              For Sale
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? '...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}
