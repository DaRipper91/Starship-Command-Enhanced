import equal from 'fast-deep-equal';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import MODULE_DEFINITIONS from '../generated/module-definitions.json';
import { createDebouncedStorage } from '../lib/storage-utils';
import { TomlParser } from '../lib/toml-parser';
import { generateId } from '../lib/utils';
import { StarshipConfig, Theme, ThemeMetadata } from '../types/starship.types';

export interface DynamicThemeSettings {
  enabled: boolean;
  dayThemeId: string;
  nightThemeId: string;
  dayStartTime: string;
  nightStartTime: string;
}

interface ThemeStore {
  currentTheme: Theme;
  savedThemes: Theme[];
  selectedModule: string | null;

  // History
  past: Theme[];
  future: Theme[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Actions
  updateConfig: (config: Partial<StarshipConfig>) => void;
  updateMetadata: (metadata: Partial<ThemeMetadata>) => void;
  setSelectedModule: (module: string | null) => void;
  loadTheme: (theme: Theme) => void;
  saveTheme: (previewImage?: string) => void;
  deleteTheme: (id: string) => void;
  resetTheme: () => void;

  // Import/Export
  exportToml: () => string;
  importToml: (tomlString: string) => void;

  // Dynamic Theme
  dynamicSettings: DynamicThemeSettings;
  updateDynamicSettings: (settings: Partial<DynamicThemeSettings>) => void;
}

const HISTORY_LIMIT = 50;

const createDefaultDynamicSettings = (): DynamicThemeSettings => ({
  enabled: false,
  dayThemeId: 'preset-clean',
  nightThemeId: 'preset-dracula',
  dayStartTime: '07:00',
  nightStartTime: '19:00',
});

const createDefaultTheme = (): Theme => ({
  metadata: {
    id: generateId(),
    name: 'Untitled Theme',
    created: new Date(),
    updated: new Date(),
  },
  config: TomlParser.getDefaultConfig(),
});

// Helper for deep cloning
const deepClone = <T>(obj: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: createDefaultTheme(),
      savedThemes: [],
      selectedModule: null,
      dynamicSettings: createDefaultDynamicSettings(),
      past: [],
      future: [],

      undo: () => {
        set((state) => {
          if (state.past.length === 0) return {};
          const previous = deepClone(state.past[state.past.length - 1]);
          const newPast = state.past.slice(0, -1);
          return {
            past: newPast,
            currentTheme: previous,
            future: [deepClone(state.currentTheme), ...state.future],
          };
        });
      },

      redo: () => {
        set((state) => {
          if (state.future.length === 0) return {};
          const next = deepClone(state.future[0]);
          const newFuture = state.future.slice(1);
          return {
            past: [...state.past, deepClone(state.currentTheme)],
            currentTheme: next,
            future: newFuture,
          };
        });
      },

      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,

      updateConfig: (newConfig) => {
        set((state) => {
          const nextTheme = {
            ...state.currentTheme,
            config: {
              ...state.currentTheme.config,
              // Ensure palettes.global is merged correctly
              palettes: {
                ...state.currentTheme.config.palettes,
                global: {
                  ...state.currentTheme.config.palettes?.global,
                  ...newConfig.palettes?.global,
                },
              },
              // Merge other config directly
              ...Object.fromEntries(
                Object.entries(newConfig).filter(([key]) => key !== 'palettes'),
              ),
            },
            metadata: {
              ...state.currentTheme.metadata,
              updated: new Date(),
            },
          };

          // Optimization: Don't update if config hasn't changed
          if (equal(state.currentTheme.config, nextTheme.config)) {
            return {};
          }

          // Use deepClone for history to ensure immutability
          return {
            past: [...state.past, deepClone(state.currentTheme)].slice(
              -HISTORY_LIMIT,
            ),
            currentTheme: nextTheme, // nextTheme is newly created, so it's safe
            future: [], // Clear redo stack on new change
          };
        });
      },

      updateMetadata: (newMetadata) => {
        set((state) => {
          const nextTheme = {
            ...state.currentTheme,
            metadata: {
              ...state.currentTheme.metadata,
              ...newMetadata,
              updated: new Date(),
            },
          };
          return {
            past: [...state.past, deepClone(state.currentTheme)].slice(
              -HISTORY_LIMIT,
            ),
            currentTheme: nextTheme,
            future: [],
          };
        });
      },

      setSelectedModule: (module) => {
        set({ selectedModule: module });
      },

      loadTheme: (theme) => {
        set((state) => ({
          past: [...state.past, deepClone(state.currentTheme)].slice(
            -HISTORY_LIMIT,
          ),
          currentTheme: deepClone(theme),
          selectedModule: null,
          future: [],
        }));
      },

      saveTheme: (previewImage?: string) => {
        const { currentTheme, savedThemes } = get();
        // We clone currentTheme to avoid reference issues in savedThemes
        const themeToSave = deepClone(currentTheme);
        if (previewImage) {
          themeToSave.metadata.previewImage = previewImage;
        }
        const existingIndex = savedThemes.findIndex(
          (t) => t.metadata.id === themeToSave.metadata.id,
        );

        const newSavedThemes = [...savedThemes];
        if (existingIndex >= 0) {
          // Update existing
          newSavedThemes[existingIndex] = themeToSave;
        } else {
          // Add new
          newSavedThemes.push(themeToSave);
        }

        set({ savedThemes: newSavedThemes });
      },

      deleteTheme: (id) => {
        set((state) => ({
          savedThemes: state.savedThemes.filter((t) => t.metadata.id !== id),
        }));
      },

      resetTheme: () => {
        set((state) => ({
          past: [...state.past, deepClone(state.currentTheme)].slice(
            -HISTORY_LIMIT,
          ),
          currentTheme: createDefaultTheme(),
          selectedModule: null,
          future: [],
        }));
      },

      exportToml: () => {
        const { currentTheme } = get();
        return TomlParser.stringify(currentTheme.config);
      },

      importToml: (tomlString) => {
        try {
          const config = TomlParser.parse(tomlString);
          set((state) => ({
            past: [...state.past, deepClone(state.currentTheme)].slice(
              -HISTORY_LIMIT,
            ),
            currentTheme: {
              ...state.currentTheme,
              config,
              metadata: {
                ...state.currentTheme.metadata,
                updated: new Date(),
              },
            },
            selectedModule: null,
            future: [],
          }));
        } catch (error) {
          console.error('Failed to import TOML:', error);
          throw error;
        }
      },

      updateDynamicSettings: (settings) => {
        set((state) => ({
          dynamicSettings: {
            ...state.dynamicSettings,
            ...settings,
          },
        }));
      },
    }),
    {
      name: 'starship-theme-storage',
      storage: createDebouncedStorage(() => localStorage),
      partialize: (state) => ({
        savedThemes: state.savedThemes,
        currentTheme: state.currentTheme,
        dynamicSettings: state.dynamicSettings,
        // Don't persist history or selection
      }),
    },
  ),
);

// Selector for active modules
export const selectActiveModules = (state: ThemeStore) => {
  const customModules = Object.keys(state.currentTheme.config.custom || {}).map(
    (id) => ({
      id,
      name: id,
      isCustom: true,
    }),
  );

  // Ensure MODULE_DEFINITIONS are also ModuleItem compatible
  const predefinedModules = MODULE_DEFINITIONS.map((def) => ({
    id: def.name,
    name: def.name,
    isCustom: false,
  }));

  const allModules = [...predefinedModules, ...customModules];

  const format = state.currentTheme.config.format || '';
  const matches = format.match(/\$([a-zA-Z0-9_]+)/g) || [];
  const existingModuleNames = new Set(allModules.map((m) => m.name));

  const parsedModules = matches
    .map((m, i) => {
      const name = m.substring(1);
      return {
        id: `${name}-${i}`,
        name: name,
        isCustom:
          allModules.find((mod) => mod.name === name)?.isCustom || false,
      };
    })
    .filter((item) => existingModuleNames.has(item.name));

  return parsedModules;
};
