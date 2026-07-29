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
  cameras: { name: string }[];
  lenses: { name: string }[];
  availableTags: string[];
  onSave: (key: string, data: Partial<PhotoMeta>) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onToggleCollection: (slug: string, add: boolean) => void;
  onSaveReferenceList: (list: 'cameras' | 'lenses', data: { name: string }[]) => void;
  onClose: () => void;
}

export default function PhotoEditor({
  photo,
  collections,
  cameras,
  lenses,
  availableTags,
  onSave,
  onDelete,
  onToggleCollection,
  onSaveReferenceList,
  onClose,
}: PhotoEditorProps) {
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
  const [addingCamera, setAddingCamera] = useState(false);
  const [addingLens, setAddingLens] = useState(false);

  const handleChange = (field: keyof PhotoMeta, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = (tag?: string) => {
    const t = (tag ?? tagInput).trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const cameraNames = cameras.map((c) => c.name);
  const lensNames = lenses.map((l) => l.name);

  const isNewCamera = form.camera && !cameraNames.includes(form.camera);
  const isNewLens = form.lens && !lensNames.includes(form.lens);

  const handleCameraSelect = (value: string) => {
    if (value === '__new__') {
      setAddingCamera(true);
      if (!form.camera) handleChange('camera', '');
    } else {
      setAddingCamera(false);
      handleChange('camera', value);
    }
  };

  const handleLensSelect = (value: string) => {
    if (value === '__new__') {
      setAddingLens(true);
      if (!form.lens) handleChange('lens', '');
    } else {
      setAddingLens(false);
      handleChange('lens', value);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNewCamera && form.camera) {
        const updated = [...cameras, { name: form.camera }];
        onSaveReferenceList('cameras', updated);
      }
      if (isNewLens && form.lens) {
        const updated = [...lenses, { name: form.lens }];
        onSaveReferenceList('lenses', updated);
      }
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

  const tagId = `tag-input-${photo.key}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="flex flex-col md:flex-row max-w-5xl w-full max-h-[90vh] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full md:w-2/5 bg-black flex items-center justify-center min-h-48 md:min-h-0">
          <img
            src={photo.url}
            alt=""
            className="w-full h-full object-contain max-h-[40vh] md:max-h-none"
          />
        </div>

        <div className="w-full md:w-3/5 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg truncate">{form.title || photo.key}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none shrink-0 ml-2">&times;</button>
          </div>

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
              rows={2}
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Camera">
              {addingCamera ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.camera}
                    onChange={(e) => handleChange('camera', e.target.value)}
                    placeholder="Type camera name..."
                    className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                    autoFocus
                  />
                  {form.camera && (
                    <p className="text-xs text-blue-400">"{form.camera}" will be saved as a new camera</p>
                  )}
                  <button
                    onClick={() => { setAddingCamera(false); handleChange('camera', ''); }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    ← Pick from list
                  </button>
                </div>
              ) : (
                <select
                  value={cameraNames.includes(form.camera) ? form.camera : isNewCamera ? '__custom' : ''}
                  onChange={(e) => handleCameraSelect(e.target.value)}
                  className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {cameras.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                  {isNewCamera && (
                    <option value="__custom" disabled>Custom: {form.camera}</option>
                  )}
                  <option value="__new__">+ Add new camera...</option>
                </select>
              )}
              {isNewCamera && !addingCamera && (
                <p className="text-xs text-amber-400 mt-1">Current value "{form.camera}" is not in the camera list</p>
              )}
            </Field>

            <Field label="Lens">
              {addingLens ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.lens}
                    onChange={(e) => handleChange('lens', e.target.value)}
                    placeholder="Type lens name..."
                    className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                    autoFocus
                  />
                  {form.lens && (
                    <p className="text-xs text-blue-400">"{form.lens}" will be saved as a new lens</p>
                  )}
                  <button
                    onClick={() => { setAddingLens(false); handleChange('lens', ''); }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    ← Pick from list
                  </button>
                </div>
              ) : (
                <select
                  value={lensNames.includes(form.lens) ? form.lens : isNewLens ? '__custom' : ''}
                  onChange={(e) => handleLensSelect(e.target.value)}
                  className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {lenses.map((l) => (
                    <option key={l.name} value={l.name}>{l.name}</option>
                  ))}
                  {isNewLens && (
                    <option value="__custom" disabled>Custom: {form.lens}</option>
                  )}
                  <option value="__new__">+ Add new lens...</option>
                </select>
              )}
              {isNewLens && !addingLens && (
                <p className="text-xs text-amber-400 mt-1">Current value "{form.lens}" is not in the lens list</p>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

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
                id={tagId}
                list="tag-suggestions"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..."
                className="flex-1 bg-neutral-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
              />
              <button onClick={() => addTag()} className="px-3 py-1.5 bg-neutral-700 rounded-lg text-sm hover:bg-neutral-600">
                Add
              </button>
            </div>
            <datalist id="tag-suggestions">
              {availableTags.filter((t) => !form.tags.includes(t)).map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>

            {availableTags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Available tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.filter((t) => !form.tags.includes(t)).map((t) => (
                    <button
                      key={t}
                      onClick={() => addTag(t)}
                      className="text-xs px-2.5 py-1 bg-neutral-800 text-gray-300 rounded-full hover:bg-neutral-700 hover:text-white transition-colors"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

          <div className="flex items-center gap-3 pt-1">
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

          <div className="flex gap-3 pt-3 border-t border-gray-800">
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
