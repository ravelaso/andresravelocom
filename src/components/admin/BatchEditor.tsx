import React, { useState } from 'react';
import type { PhotoMeta, ReferenceList } from '@/types/admin';

type BatchPhotoMeta = Partial<Pick<PhotoMeta, 'tags' | 'camera' | 'lens' | 'film'>>;

interface BatchEditorProps {
  count: number;
  cameras: ReferenceList;
  lenses: ReferenceList;
  availableTags: string[];
  onApply: (data: Partial<BatchPhotoMeta>) => void;
  onBatchDelete: () => void;
  onSaveReferenceList: (list: 'cameras' | 'lenses', data: ReferenceList) => void;
  onClose: () => void;
}

export default function BatchEditor({ count, cameras, lenses, availableTags, onApply, onBatchDelete, onSaveReferenceList, onClose }: BatchEditorProps) {
  const [camera, setCamera] = useState('');
  const [lens, setLens] = useState('');
  const [film, setFilm] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [replaceTags, setReplaceTags] = useState(true);
  const [addingCamera, setAddingCamera] = useState(false);
  const [addingLens, setAddingLens] = useState(false);

  const cameraNames = cameras.map((c) => c.name);
  const lensNames = lenses.map((l) => l.name);

  const addTag = (tag?: string) => {
    const t = (tag ?? tagInput).trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleCameraSelect = (value: string) => {
    if (value === '__new__') { setAddingCamera(true); if (!camera) setCamera(''); }
    else { setAddingCamera(false); setCamera(value); }
  };

  const handleLensSelect = (value: string) => {
    if (value === '__new__') { setAddingLens(true); if (!lens) setLens(''); }
    else { setAddingLens(false); setLens(value); }
  };

  const applyChanges = () => {
    const data: Partial<BatchPhotoMeta> = {};
    if (camera) data.camera = camera;
    if (lens) data.lens = lens;
    if (film) data.film = film;
    if (tags.length > 0) data.tags = tags;
    else if (!replaceTags) data.tags = [];

    if (camera && !cameraNames.includes(camera)) {
      onSaveReferenceList('cameras', [...cameras, { name: camera }]);
    }
    if (lens && !lensNames.includes(lens)) {
      onSaveReferenceList('lenses', [...lenses, { name: lens }]);
    }
    onApply(data);
  };

  const hasAnyValue = camera || lens || film || tags.length > 0;
  const tagId = 'batch-tag-input';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-lg">Batch Edit — {count} photo{count !== 1 ? 's' : ''}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Camera">
              {addingCamera ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={camera}
                    onChange={(e) => setCamera(e.target.value)}
                    placeholder="Type camera name..."
                    className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                    autoFocus
                  />
                  {camera && <p className="text-xs text-blue-400">Will be saved as a new camera</p>}
                  <button onClick={() => { setAddingCamera(false); setCamera(''); }} className="text-xs text-gray-400 hover:text-white">← Pick from list</button>
                </div>
              ) : (
                <select
                  value={cameraNames.includes(camera) ? camera : ''}
                  onChange={(e) => handleCameraSelect(e.target.value)}
                  className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">— Leave unchanged —</option>
                  {cameras.map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
                  <option value="__new__">+ Add new camera...</option>
                </select>
              )}
            </Field>

            <Field label="Lens">
              {addingLens ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={lens}
                    onChange={(e) => setLens(e.target.value)}
                    placeholder="Type lens name..."
                    className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                    autoFocus
                  />
                  {lens && <p className="text-xs text-blue-400">Will be saved as a new lens</p>}
                  <button onClick={() => { setAddingLens(false); setLens(''); }} className="text-xs text-gray-400 hover:text-white">← Pick from list</button>
                </div>
              ) : (
                <select
                  value={lensNames.includes(lens) ? lens : ''}
                  onChange={(e) => handleLensSelect(e.target.value)}
                  className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">— Leave unchanged —</option>
                  {lenses.map((l) => (<option key={l.name} value={l.name}>{l.name}</option>))}
                  <option value="__new__">+ Add new lens...</option>
                </select>
              )}
            </Field>
          </div>

          <Field label="Film">
            <input
              type="text"
              value={film}
              onChange={(e) => setFilm(e.target.value)}
              placeholder="Leave empty to keep unchanged"
              className="w-full bg-neutral-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-700 rounded text-xs">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-white">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                id={tagId}
                list="batch-tag-suggestions"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..."
                className="flex-1 bg-neutral-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
              />
              <button onClick={() => addTag()} className="px-3 py-1.5 bg-neutral-700 rounded-lg text-sm hover:bg-neutral-600">Add</button>
            </div>
            <datalist id="batch-tag-suggestions">
              {availableTags.filter((t) => !tags.includes(t)).map((t) => (<option key={t} value={t} />))}
            </datalist>

            <label className="flex items-center gap-2 text-xs text-gray-400 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceTags}
                onChange={(e) => setReplaceTags(e.target.checked)}
                className="rounded"
              />
              Replace all existing tags
            </label>
            {!replaceTags && (
              <p className="text-xs text-gray-500 mt-1">Tags above will be appended to existing ones</p>
            )}
          </Field>

          <div className="pt-4 border-t border-red-900/50">
            <button
              onClick={onBatchDelete}
              className="w-full px-4 py-2 text-sm text-red-400 hover:text-white border border-red-800/50 hover:border-red-600 rounded-lg transition-colors"
            >
              Delete These {count} Photo{count !== 1 ? 's' : ''}
            </button>
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-800">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-neutral-800 text-gray-300 rounded-lg font-medium hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={applyChanges}
              disabled={!hasAnyValue}
              className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Apply to {count} photo{count !== 1 ? 's' : ''}
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
