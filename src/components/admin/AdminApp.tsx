import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import PhotoGrid from './PhotoGrid';
import PhotoEditor from './PhotoEditor';
import UploadZone from './UploadZone';
import CollectionManager from './CollectionManager';
import CollectionEditor from './CollectionEditor';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<AdminPhoto | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'featured' | 'untagged'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [photosRes, metaData, collectionsData] = await Promise.all([
      fetch('/api/admin/photos'),
      readDataFile('photos.json'),
      readDataFile('collections.json'),
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
          title: keyToTitle(p.key),
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
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPhotos = photos.filter((p) => {
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
    const updated: Record<string, Collection> = {};
    for (const key of Object.keys(collections)) {
      if (key !== slug) updated[key] = collections[key];
    }
    setCollections(updated);
    await writeDataFile('collections.json', updated);
  };

  return (
    <>
      <AdminLayout
        collections={collections}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onAddCollection={() => setEditingCollection('__new__')}
        onEditCollection={setEditingCollection}
        onDeleteCollection={handleDeleteCollection}
        onUpload={() => setShowUpload(true)}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading photos...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : (
          <PhotoGrid
            photos={filteredPhotos}
            collections={collections}
            onSelect={setSelectedPhoto}
          />
        )}
      </AdminLayout>

      {selectedPhoto && (
        <PhotoEditor
          photo={selectedPhoto}
          collections={collections}
          onSave={handleSaveMeta}
          onDelete={handleDeletePhoto}
          onToggleCollection={handleToggleCollection}
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

      <NotificationToast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
