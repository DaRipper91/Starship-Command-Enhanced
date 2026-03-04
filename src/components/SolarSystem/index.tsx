import { Download, Star, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchJson } from '../../lib/api';
import { useThemeStore } from '../../stores/theme-store';
import { Theme } from '../../types/starship.types';

interface CommunityTheme {
  id: number;
  name: string;
  description: string;
  config_toml: string;
  preview_image?: string;
  category: string;
  downloads: number;
  author_username: string;
  created_at: string;
  updated_at: string;
}

interface SolarSystemProps {
  onClose: () => void;
}

export function SolarSystem({ onClose }: SolarSystemProps) {
  const { loadTheme } = useThemeStore();
  const { addToast } = useToast();
  const confirm = useConfirmation();

  const [themes, setThemes] = useState<CommunityTheme[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await fetchJson<string[]>(
        '/api/categories',
        {},
        'Failed to fetch categories.',
      );
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    }
  };

  const fetchThemes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      // No direct search endpoint for now, client-side filter for simplicity

      let data = await fetchJson<CommunityTheme[]>(
        `/api/themes?${params.toString()}`,
        {},
        'Failed to fetch themes.',
      );

      if (searchTerm) {
        data = data.filter(
          (theme) =>
            theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (theme.description &&
              theme.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase())),
        );
      }

      setThemes(data);
    } catch (err) {
      console.error('Error fetching themes:', err);
      setError('Failed to load themes.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleDownloadAndApply = async (theme: CommunityTheme) => {
    const confirmed = await confirm({
      title: `Download & Apply "${theme.name}"?`,
      message:
        'This will replace your current theme. Ensure you have saved any unsaved changes.',
      confirmText: 'Apply Theme',
    });
    if (confirmed) {
      try {
        // The theme object from the API already contains config_toml
        // We need to parse it back into the StarshipConfig object and load it.
        const newConfig = JSON.parse(theme.config_toml); // Assuming it's JSON stringified TOML
        const downloadedTheme: Theme = {
          metadata: {
            id: theme.id.toString(),
            name: theme.name,
            description: theme.description,
            author: theme.author_username,
            created: new Date(theme.created_at),
            updated: new Date(theme.updated_at),
            previewImage: theme.preview_image,
            isPreset: false,
          },
          config: newConfig,
        };
        loadTheme(downloadedTheme);
        addToast(`Theme "${theme.name}" applied!`, 'success');
        onClose();
      } catch (err) {
        console.error('Error applying theme:', err);
        addToast('Failed to apply theme.', 'error');
      }
    }
  };

  const filteredThemes = themes; // Filtering done on client-side for now

  return (
    <div className="flex h-[80vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-800/50 p-4">
        <h2 className="text-lg font-bold text-white">Solar System Themes</h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for Categories */}
        <aside className="w-56 shrink-0 border-r border-gray-800 bg-gray-800/30 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Categories
          </h3>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full rounded px-2 py-1 text-left text-sm transition-colors ${!selectedCategory ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                All Themes
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full rounded px-2 py-1 text-left text-sm transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content for Themes */}
        <main className="flex flex-1 flex-col p-4">
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search themes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {isLoading && <span className="text-gray-400">Loading...</span>}
          </div>

          {error && <p className="mb-4 text-sm text-red-500">Error: {error}</p>}

          <div className="scrollbar-thin scrollbar-thumb-gray-700 grid flex-1 grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {filteredThemes.length === 0 && !isLoading && !error ? (
              <p className="col-span-full text-center text-gray-500">
                No themes found for this criteria.
              </p>
            ) : (
              filteredThemes.map((theme) => (
                <div
                  key={theme.id}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-sm transition-all hover:border-blue-500 hover:shadow-lg"
                >
                  <div className="flex h-32 items-center justify-center bg-gray-900">
                    {theme.preview_image ? (
                      <img
                        src={theme.preview_image}
                        alt={`Preview of ${theme.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">No Preview</span>
                    )}
                  </div>
                  <div className="flex flex-col p-4">
                    <h3 className="font-medium text-gray-200 group-hover:text-blue-400">
                      {theme.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {theme.description || 'No description provided.'}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-500" />{' '}
                        {theme.downloads}
                      </span>
                      <span>By {theme.author_username}</span>
                    </div>
                    <button
                      onClick={() => handleDownloadAndApply(theme)}
                      className="mt-4 w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                      <Download size={14} className="mr-2 inline-block" />{' '}
                      Download & Apply
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
