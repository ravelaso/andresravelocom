import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import PhotoGrid from './PhotoGrid';
import PhotoEditor from './PhotoEditor';
import UploadZone from './UploadZone';
import CollectionManager from './CollectionManager';
import CollectionEditor from './CollectionEditor';
import BatchEditor from './BatchEditor';
import NotificationToast, { useToast } from './NotificationToast';

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
  size: number;
  lastModified: string;
  meta: PhotoMeta | null;
}

interface Collection {
  title: string;
  description?: string;
  coverPhoto?: string;
  photos: string[];
}

function keyToTitle(key: string): string {
  const name = key.split('/').pop()?.replace(/\.[^.]+$/, '') ?? key;
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildMetaMap(photos: AdminPhoto[]): Record<string, PhotoMeta> {
  const map: Record<string, PhotoMeta> = {};
  for (const p of photos) {
    if (p.meta) map[p.key] = p.meta;
  }
  return map;
}

async function readDataFile(file: string): Promise<any> {
  try {
    const res = await fetch(`/_admin-io/read?file=${file}`);
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

async function writeDataFile(file: string, data: any): Promise<boolean> {
  try {
    const res = await fetch('/_admin-io/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function AdminApp() {
  const { toasts, addToast, dismissToast } = useToast();
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [collections, setCollections] = useState<Record<string, Collection>>({});
  const [cameras, setCameras] = useState<{ name: string }[]>([]);
  const [lenses, setLenses] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<AdminPhoto | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'featured' | 'untagged'>('all');
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [batchEditorOpen, setBatchEditorOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [photosRes, metaData, collectionsData, camerasData, lensesData] = await Promise.all([
      fetch('/api/admin/photos'),
      readDataFile('photos.json'),
      readDataFile('collections.json'),
      readDataFile('cameras.json'),
      readDataFile('lenses.json'),
    ]);

    if (!photosRes.ok) {
      addToast('error', 'Failed to load photos from R2');
      if (!collectionsData) {
        setError('Failed to load photos and collections');
      }
    }

    const r2Photos = photosRes.ok ? (await photosRes.json()).photos : [];
    const existingMeta: Record<string, PhotoMeta> = metaData;

    const merged: AdminPhoto[] = r2Photos.map((p: any) => ({
      key: p.key,
      url: p.url,
      size: p.size,
      lastModified: p.lastModified,
      meta: existingMeta[p.key] ?? null,
    }));

    const needMeta = merged.filter((p) => !p.meta);
    if (needMeta.length > 0) {
      for (const p of needMeta) {
        existingMeta[p.key] = {
          title: '',
          tags: [],
          featured: false,
          forSale: false,
        };
      }
      for (const p of merged) {
        if (existingMeta[p.key]) p.meta = existingMeta[p.key];
      }
      await writeDataFile('photos.json', existingMeta);
      addToast('info', `Found ${needMeta.length} new photo(s) — metadata synced`);
    }

    setPhotos(merged);
    setCollections(collectionsData);
    setCameras(Array.isArray(camerasData) ? camerasData : []);
    setLenses(Array.isArray(lensesData) ? lensesData : []);
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (f: 'all' | 'featured' | 'untagged') => {
    setActiveCollection(null);
    setActiveFilter(f);
  };

  const handleSelectCollection = (slug: string | null) => {
    setActiveCollection(slug);
    if (slug) setActiveFilter('all');
  };

  const filteredPhotos = photos.filter((p) => {
    if (activeCollection) {
      const col = collections[activeCollection];
      return col ? col.photos.includes(p.key) : false;
    }
    if (activeFilter === 'featured') return p.meta?.featured;
    if (activeFilter === 'untagged') return !p.meta?.tags?.length;
    return true;
  });

  const handleSaveMeta = async (key: string, data: Partial<PhotoMeta>) => {
    const updated = photos.map((p) =>
      p.key === key ? { ...p, meta: { ...p.meta, ...data } as PhotoMeta } : p
    );
    setPhotos(updated);
    const ok = await writeDataFile('photos.json', buildMetaMap(updated));
    addToast(ok ? 'success' : 'error', ok ? 'Saved' : 'Failed to save metadata');
  };

  const handleDeletePhoto = async (key: string) => {
    const res = await fetch(`/api/admin/photos/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      addToast('error', body.error || 'Failed to delete photo from R2');
      return;
    }

    const updated = photos.filter((p) => p.key !== key);
    setPhotos(updated);

    const updatedCollections: Record<string, Collection> = {};
    for (const slug of Object.keys(collections)) {
      const c = { ...collections[slug] };
      c.photos = c.photos.filter((k) => k !== key);
      updatedCollections[slug] = c;
    }
    setCollections(updatedCollections);

    await Promise.all([
      writeDataFile('photos.json', buildMetaMap(updated)),
      writeDataFile('collections.json', updatedCollections),
    ]);

    setSelectedPhoto(null);
  };

  const handleSaveCollection = async (slug: string, data: Collection) => {
    if (editingCollection === '__new__' && collections[slug]) {
      addToast('error', 'A collection with this slug already exists');
      return;
    }
    const updated = { ...collections, [slug]: data };
    setCollections(updated);
    const ok = await writeDataFile('collections.json', updated);
    addToast(ok ? 'success' : 'error', ok ? 'Collection saved' : 'Failed to save collection');
    setEditingCollection(null);
  };

  const handleToggleCollection = async (slug: string, add: boolean) => {
    if (!selectedPhoto) return;
    const key = selectedPhoto.key;
    const updated: Record<string, Collection> = {};
    for (const s of Object.keys(collections)) {
      updated[s] = { ...collections[s] };
      if (s === slug) {
        if (add && !updated[s].photos.includes(key)) {
          updated[s].photos = [...updated[s].photos, key];
        } else if (!add) {
          updated[s].photos = updated[s].photos.filter((k) => k !== key);
        }
      }
    }
    setCollections(updated);
    await writeDataFile('collections.json', updated);
  };

  const handleDeleteCollection = async (slug: string) => {
    if (slug === activeCollection) setActiveCollection(null);
    const updated: Record<string, Collection> = {};
    for (const key of Object.keys(collections)) {
      if (key !== slug) updated[key] = collections[key];
    }
    setCollections(updated);
    await writeDataFile('collections.json', updated);
  };

  const handleSaveReferenceList = async (list: 'cameras' | 'lenses', data: { name: string }[]) => {
    if (list === 'cameras') setCameras(data);
    else setLenses(data);
    const ok = await writeDataFile(`${list}.json`, data);
    addToast(ok ? 'success' : 'error', ok ? `${list} saved` : `Failed to save ${list}`);
  };

  const handleToggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleClearSelection = () => setSelectedKeys(new Set());

  const handleBatchApply = async (data: Partial<PhotoMeta>) => {
    const updated = photos.map((p) =>
      selectedKeys.has(p.key) ? { ...p, meta: { ...p.meta, ...data } as PhotoMeta } : p
    );
    setPhotos(updated);
    const ok = await writeDataFile('photos.json', buildMetaMap(updated));
    addToast(ok ? 'success' : 'error', ok ? 'Batch update applied' : 'Failed to apply batch update');
    setSelectedKeys(new Set());
    setBatchEditorOpen(false);
  };

  const handleBatchDelete = async () => {
    const count = selectedKeys.size;
    if (!window.confirm(`Delete ${count} photo${count !== 1 ? 's' : ''}? This cannot be undone.`)) return;

    const keys = Array.from(selectedKeys);
    const results = await Promise.allSettled(
      keys.map((key) =>
        fetch(`/api/admin/photos/${encodeURIComponent(key)}`, { method: 'DELETE' })
      )
    );

    const succeeded: string[] = [];
    const failed: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.ok) succeeded.push(keys[i]);
      else failed.push(keys[i]);
    });

    const remaining = photos.filter((p) => !succeeded.includes(p.key));
    setPhotos(remaining);

    const updatedCollections: Record<string, Collection> = {};
    for (const slug of Object.keys(collections)) {
      const c = { ...collections[slug] };
      c.photos = c.photos.filter((k) => !succeeded.includes(k));
      updatedCollections[slug] = c;
    }
    setCollections(updatedCollections);

    await Promise.all([
      writeDataFile('photos.json', buildMetaMap(remaining)),
      writeDataFile('collections.json', updatedCollections),
    ]);

    setSelectedKeys(new Set());
    setBatchEditorOpen(false);

    if (failed.length === 0) {
      addToast('success', `Deleted ${succeeded.length} photo${succeeded.length !== 1 ? 's' : ''}`);
    } else {
      addToast('error', `Deleted ${succeeded.length}, failed ${failed.length}`);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      addToast('info', 'Preparing backup...');
      const res = await fetch('/api/admin/backup');
      if (!res.ok) { addToast('error', 'Backup failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photos-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('success', 'Backup downloaded');
    } catch {
      addToast('error', 'Backup failed');
    }
  };

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of photos) if (p.meta?.tags) p.meta.tags.forEach((t) => set.add(t));
    return Array.from(set).sort();
  }, [photos]);

  const collectionLabel = activeCollection && collections[activeCollection];
  const collectionPhotoCount = collectionLabel
    ? photos.filter((p) => collectionLabel.photos.includes(p.key)).length
    : 0;

  return (
    <>
      <AdminLayout
        collections={collections}
        activeCollection={activeCollection}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onSelectCollection={handleSelectCollection}
        onAddCollection={() => setEditingCollection('__new__')}
        onEditCollection={setEditingCollection}
        onDeleteCollection={handleDeleteCollection}
          onUpload={() => setShowUpload(true)}
          onDownload={handleDownloadBackup}
        >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading photos...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : (
          <>
            {collectionLabel && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSelectCollection(null)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    ← All Photos
                  </button>
                  <h2 className="text-lg font-semibold">
                    {collectionLabel.title}
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      {collectionPhotoCount} photo{collectionPhotoCount !== 1 ? 's' : ''}
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => setEditingCollection(activeCollection)}
                  className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Edit Collection
                </button>
              </div>
            )}
            <PhotoGrid
              photos={filteredPhotos}
              collections={collections}
              onSelect={setSelectedPhoto}
              selectedKeys={selectedKeys}
              onToggleSelect={handleToggleSelect}
            />
          </>
        )}
      </AdminLayout>

      {selectedKeys.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur border-t border-gray-700 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-300">
            {selectedKeys.size} photo{selectedKeys.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setBatchEditorOpen(true)}
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              Batch Edit
            </button>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <PhotoEditor
          photo={selectedPhoto}
          collections={collections}
          cameras={cameras}
          lenses={lenses}
          availableTags={availableTags}
          onSave={handleSaveMeta}
          onDelete={handleDeletePhoto}
          onToggleCollection={handleToggleCollection}
          onSaveReferenceList={handleSaveReferenceList}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {showUpload && (
        <UploadZone
          onDone={() => { setShowUpload(false); loadData(); }}
          onClose={() => setShowUpload(false)}
        />
      )}

      {editingCollection && (
        <CollectionEditor
          slug={editingCollection === '__new__' ? null : editingCollection}
          data={editingCollection === '__new__' ? null : collections[editingCollection]}
          photos={photos}
          onSave={handleSaveCollection}
          onClose={() => setEditingCollection(null)}
        />
      )}

      {batchEditorOpen && (
        <BatchEditor
          count={selectedKeys.size}
          cameras={cameras}
          lenses={lenses}
          availableTags={availableTags}
          onApply={handleBatchApply}
          onBatchDelete={handleBatchDelete}
          onClose={() => setBatchEditorOpen(false)}
        />
      )}

      <NotificationToast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
