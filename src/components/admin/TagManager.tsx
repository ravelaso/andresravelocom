import { useState } from 'react';
import type { TagSummary } from '@/types/admin';

interface TagManagerProps {
  tags: TagSummary[];
  activeTag: string | null;
  onSelect: (tag: string) => void;
  onRename: (oldName: string, newName: string) => Promise<boolean>;
  onDelete: (name: string) => void;
}

export default function TagManager({ tags, activeTag, onSelect, onRename, onDelete }: TagManagerProps) {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startEdit = (name: string) => {
    setEditingName(name);
    setDraft(name);
  };

  const cancelEdit = () => {
    setEditingName(null);
    setDraft('');
  };

  const submitEdit = async () => {
    if (!editingName) return;
    const ok = await onRename(editingName, draft);
    if (ok) cancelEdit();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tags</h3>
      </div>

      <div className="space-y-1">
        {tags.map(({ name, count }) => {
          const isActive = name === activeTag;
          const isEditing = name === editingName;
          if (isEditing) {
            return (
              <input
                key={name}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); submitEdit(); }
                  else if (e.key === 'Escape') cancelEdit();
                }}
                onBlur={cancelEdit}
                autoFocus
                className="w-full bg-neutral-800 border border-blue-500 rounded-lg px-3 py-2 text-sm text-white"
              />
            );
          }
          return (
            <div
              key={name}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <button
                onClick={() => onSelect(name)}
                className={`text-sm truncate flex-1 text-left ${
                  isActive ? 'text-white font-medium' : 'text-gray-400 hover:text-white'
                }`}
              >
                {name}
                <span className="text-xs ml-2 text-gray-600">{count}</span>
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(name); }}
                  className="text-gray-500 hover:text-white p-1"
                  title="Rename tag"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(name); }}
                  className="text-gray-600 hover:text-red-400 p-1"
                  title="Delete tag"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {tags.length === 0 && (
          <p className="text-xs text-gray-600 px-3">No tags yet — add tags to photos</p>
        )}
      </div>
    </div>
  );
}
