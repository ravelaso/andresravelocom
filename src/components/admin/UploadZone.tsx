import React, { useState, useRef } from 'react';

interface UploadZoneProps {
  onDone: () => void;
  onClose: () => void;
}

export default function UploadZone({ onDone, onClose }: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ name: string; status: 'done' | 'error'; error?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(f.type)
    );
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setUploading(true);
    const newResults: { name: string; status: 'done' | 'error'; error?: string }[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/admin/photos/upload', { method: 'POST', body: formData });
        if (res.ok) {
          newResults.push({ name: file.name, status: 'done' });
        } else {
          const err = await res.json();
          newResults.push({ name: file.name, status: 'error', error: err.error });
        }
      } catch {
        newResults.push({ name: file.name, status: 'error', error: 'Network error' });
      }
    }

    setResults(newResults);
    setUploading(false);
    setFiles([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-neutral-900 rounded-2xl w-full max-w-lg border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold">Upload Photos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-gray-400">Drop images here or click to select</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleSelect}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">{files.length} file(s) selected</p>
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-neutral-800 rounded-lg px-3 py-2">
                  <span className="truncate">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 ml-2">&times;</button>
                </div>
              ))}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Results</p>
              {results.map((r, i) => (
                <div key={i} className={`text-sm ${r.status === 'done' ? 'text-green-400' : 'text-red-400'}`}>
                  {r.name} — {r.status === 'done' ? 'Uploaded' : r.error}
                </div>
              ))}
              <button
                onClick={onDone}
                className="w-full px-4 py-2 bg-neutral-700 text-white rounded-lg text-sm hover:bg-neutral-600 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
