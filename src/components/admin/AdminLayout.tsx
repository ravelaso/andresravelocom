import React from 'react';
import CollectionManager from './CollectionManager';

interface Collection {
  title: string;
  description?: string;
  coverPhoto?: string;
  photos: string[];
}

interface AdminLayoutProps {
  collections: Record<string, Collection>;
  activeCollection: string | null;
  activeFilter: 'all' | 'featured' | 'untagged';
  onFilterChange: (f: 'all' | 'featured' | 'untagged') => void;
  onSelectCollection: (slug: string | null) => void;
  onAddCollection: () => void;
  onEditCollection: (slug: string) => void;
  onDeleteCollection: (slug: string) => void;
  onUpload: () => void;
  onDownload: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  collections,
  activeCollection,
  activeFilter,
  onFilterChange,
  onSelectCollection,
  onAddCollection,
  onEditCollection,
  onDeleteCollection,
  onUpload,
  onDownload,
  children,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-gray-200">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Photo Admin</h1>
        <div className="flex gap-3">
          <button
            onClick={onDownload}
            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Download All
          </button>
          <button
            onClick={onUpload}
            className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Upload
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 shrink-0 border-r border-gray-800 p-4 h-[calc(100vh-65px)] overflow-y-auto">
          <nav className="space-y-1 mb-6">
            <FilterButton
              label="All"
              active={activeFilter === 'all' && !activeCollection}
              onClick={() => { onSelectCollection(null); onFilterChange('all'); }}
            />
            <FilterButton
              label="Featured"
              active={activeFilter === 'featured'}
              onClick={() => { onSelectCollection(null); onFilterChange('featured'); }}
            />
            <FilterButton
              label="Untagged"
              active={activeFilter === 'untagged'}
              onClick={() => { onSelectCollection(null); onFilterChange('untagged'); }}
            />
          </nav>

          <div className="border-t border-gray-800 pt-4">
            <CollectionManager
              collections={collections}
              activeCollection={activeCollection}
              onSelect={onSelectCollection}
              onAdd={onAddCollection}
              onEdit={onEditCollection}
              onDelete={onDeleteCollection}
            />
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto h-[calc(100vh-65px)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  );
}
