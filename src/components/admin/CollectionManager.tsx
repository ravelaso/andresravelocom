import React from 'react';

interface Collection {
  title: string;
  description?: string;
  coverPhoto?: string;
  photos: string[];
}

interface CollectionManagerProps {
  collections: Record<string, Collection>;
  onAdd: () => void;
  onEdit: (slug: string) => void;
  onDelete: (slug: string) => void;
}

export default function CollectionManager({ collections, onAdd, onEdit, onDelete }: CollectionManagerProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Collections</h3>
        <button
          onClick={onAdd}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          + New
        </button>
      </div>

      <div className="space-y-1">
        {Object.entries(collections).map(([slug, col]) => (
          <div
            key={slug}
            className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <button
              onClick={() => onEdit(slug)}
              className="text-sm text-gray-400 hover:text-white truncate"
            >
              {col.title}
              <span className="text-xs text-gray-600 ml-2">({col.photos.length})</span>
            </button>
            <button
              onClick={() => onDelete(slug)}
              className="text-xs text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              del
            </button>
          </div>
        ))}

        {Object.keys(collections).length === 0 && (
          <p className="text-xs text-gray-600 px-3">No collections yet</p>
        )}
      </div>
    </div>
  );
}
