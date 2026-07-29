import React from 'react';

interface Collection {
  title: string;
  description?: string;
  coverPhoto?: string;
  photos: string[];
}

interface CollectionManagerProps {
  collections: Record<string, Collection>;
  activeCollection: string | null;
  onSelect: (slug: string) => void;
  onAdd: () => void;
  onEdit: (slug: string) => void;
  onDelete: (slug: string) => void;
}

export default function CollectionManager({
  collections,
  activeCollection,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: CollectionManagerProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Collections</h3>
        <button onClick={onAdd} className="text-xs text-blue-400 hover:text-blue-300">
          + New
        </button>
      </div>

      <div className="space-y-1">
        {Object.entries(collections).map(([slug, col]) => {
          const isActive = slug === activeCollection;
          return (
            <div
              key={slug}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <button
                onClick={() => onSelect(slug)}
                className={`text-sm truncate flex-1 text-left ${
                  isActive ? 'text-white font-medium' : 'text-gray-400 hover:text-white'
                }`}
              >
                {col.title}
                <span className="text-xs ml-2 text-gray-600">{col.photos.length}</span>
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(slug); }}
                  className="text-gray-500 hover:text-white p-1"
                  title="Edit collection"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(slug); }}
                  className="text-gray-600 hover:text-red-400 p-1"
                  title="Delete collection"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {Object.keys(collections).length === 0 && (
          <p className="text-xs text-gray-600 px-3">No collections yet</p>
        )}
      </div>
    </div>
  );
}
