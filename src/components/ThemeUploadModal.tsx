import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useToast } from '../contexts/ToastContext';
import { fetchJson } from '../lib/api';
import { useThemeStore } from '../stores/theme-store';

interface ThemeUploadModalProps {
  onClose: () => void;
  userId: number;
}

export function ThemeUploadModal({ onClose, userId }: ThemeUploadModalProps) {
  const { currentTheme, exportToml } = useThemeStore();
  const { addToast } = useToast();

  const [name, setName] = useState(currentTheme.metadata.name || '');
  const [description, setDescription] = useState(
    currentTheme.metadata.description || '',
  );
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await fetchJson<string[]>('/api/categories');
        setCategories(data);
        if (data.length > 0) setCategory(data[0]);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const config_toml = exportToml();
      const payload = {
        name,
        description,
        category,
        config_toml,
        author_id: userId,
        preview_image: currentTheme.metadata.previewImage || null,
      };

      await fetchJson(
        '/api/themes',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        'Failed to upload theme',
      );

      addToast('Theme uploaded successfully to Community Gallery!', 'success');
      onClose();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-800/50 p-4">
        <h2 className="text-lg font-bold text-white">Upload to Community</h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Theme Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-24 w-full resize-none rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Tell us about this theme..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Publish Theme'}
        </button>
      </form>
    </div>
  );
}
