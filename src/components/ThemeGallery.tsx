import { Clock, Play, Trash2 } from 'lucide-react';

import { useConfirmation } from '../contexts/ConfirmationContext';
import { useToast } from '../contexts/ToastContext';
import { logger } from '../lib/logger';
import { PRESET_THEMES } from '../lib/presets';
import { cn } from '../lib/utils';
import { useThemeStore } from '../stores/theme-store';
import { Theme } from '../types/starship.types';

interface ThemeGalleryProps {
  className?: string;
  onSelect?: () => void;
}

export function ThemeGallery({ className, onSelect }: ThemeGalleryProps) {
  const { loadTheme, savedThemes, deleteTheme } = useThemeStore();
  const { addToast } = useToast();
  const confirm = useConfirmation();

  const handleLoad = async (theme: Theme) => {
    const { currentTheme, savedThemes, past } = useThemeStore.getState();

    // Check if unsaved
    const saved = savedThemes.find(
      (t) => t.metadata.id === currentTheme.metadata.id,
    );
    let hasUnsavedChanges = false;

    if (!saved) {
      // Not in saved themes
      hasUnsavedChanges = true;
    } else {
      // In saved themes, check timestamp
      // We compare timestamps to see if current is newer
      if (
        new Date(currentTheme.metadata.updated) >
        new Date(saved.metadata.updated)
      ) {
        hasUnsavedChanges = true;
      }
    }

    // Only prompt if there is history (user has done something)
    const hasHistory = past.length > 0;

    if (hasUnsavedChanges && hasHistory) {
      const confirmed = await confirm({
        title: 'Unsaved Changes',
        message:
          'You have unsaved changes that will be lost. Are you sure you want to load a new theme?',
        confirmText: 'Load Anyway',
      });
      if (!confirmed) return;
    }

    try {
      loadTheme(theme);
      if (onSelect) onSelect();
      addToast('Theme loaded successfully!', 'success');
    } catch (error) {
      logger.error('Failed to load theme:', error);
      addToast('Failed to load theme.', 'error');
    }
  };

  const handleDelete = async (theme: Theme) => {
    const confirmed = await confirm({
      title: 'Delete Theme',
      message: `Are you sure you want to permanently delete "${theme.metadata.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
    });
    if (confirmed) {
      deleteTheme(theme.metadata.id);
      addToast(`Theme "${theme.metadata.name}" deleted.`, 'info');
    }
  };

  return (
    <div className={cn('grid h-full gap-8 overflow-y-auto p-6', className)}>
      {/* Presets Section */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Play className="h-5 w-5 text-blue-500" />
          Preset Themes
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESET_THEMES.map((theme) => (
            <button
              key={theme.metadata.id}
              type="button"
              className="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 text-left transition-all hover:border-gray-600 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => handleLoad(theme)}
              aria-label={`Load preset theme: ${theme.metadata.name}`}
            >
              <div className="flex h-32 items-center justify-center bg-gray-900">
                {theme.metadata.previewImage ? (
                  <img
                    src={theme.metadata.previewImage}
                    alt={`Preview of ${theme.metadata.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-500">No Preview</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-200 group-hover:text-blue-400">
                  {theme.metadata.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {theme.metadata.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Saved Themes Section */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Clock className="h-5 w-5 text-purple-500" />
          Saved Themes
        </h2>

        {savedThemes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900/30 py-12 text-center">
            <p className="text-gray-500">No saved themes yet.</p>
            <p className="mt-1 text-xs text-gray-600">
              Save your current customization to see it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedThemes.map((theme) => (
              <div
                key={theme.metadata.id}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 transition-all hover:border-gray-600 hover:shadow-lg"
              >
                <button
                  type="button"
                  className="w-full flex-1 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  onClick={() => handleLoad(theme)}
                  aria-label={`Load saved theme: ${theme.metadata.name}`}
                >
                  <div className="flex h-32 items-center justify-center bg-gray-900">
                    {theme.metadata.previewImage ? (
                      <img
                        src={theme.metadata.previewImage}
                        alt={`Preview of ${theme.metadata.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">
                        No Preview Available
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-200 group-hover:text-purple-400">
                      {theme.metadata.name}
                    </h3>
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(theme);
                  }}
                  className="absolute right-2 top-2 rounded p-1.5 text-gray-500 opacity-0 transition-opacity hover:bg-red-900/20 hover:text-red-400 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 group-hover:opacity-100"
                  title="Delete theme"
                  aria-label={`Delete theme ${theme.metadata.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
