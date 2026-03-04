import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type View = 'welcome' | 'preview' | 'colors' | 'modules' | 'editor';
export type LayoutMode = 'auto' | 'mobile' | 'desktop';

interface UIStore {
  activeView: View;
  setActiveView: (view: View) => void;

  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;

  showExportImport: 'export' | 'import' | null;
  setShowExportImport: (state: 'export' | 'import' | null) => void;

  showGallery: boolean;
  setShowGallery: (state: boolean) => void;

  showComparison: boolean;
  setShowComparison: (state: boolean) => void;

  showCommandPalette: boolean;
  setShowCommandPalette: (state: boolean) => void;

  showDynamicThemeSettings: boolean;
  setShowDynamicThemeSettings: (state: boolean) => void;

  showWelcomeWizard: boolean;
  setShowWelcomeWizard: (state: boolean) => void;

  showSolarSystem: boolean;
  setShowSolarSystem: (state: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      activeView: 'welcome',
      setActiveView: (view) => set({ activeView: view }),

      layoutMode: 'auto',
      setLayoutMode: (mode) => set({ layoutMode: mode }),

      showExportImport: null,
      setShowExportImport: (state) => set({ showExportImport: state }),

      showGallery: false,
      setShowGallery: (state) => set({ showGallery: state }),

      showComparison: false,
      setShowComparison: (state) => set({ showComparison: state }),

      showCommandPalette: false,
      setShowCommandPalette: (state) => set({ showCommandPalette: state }),

      showDynamicThemeSettings: false,
      setShowDynamicThemeSettings: (state) =>
        set({ showDynamicThemeSettings: state }),

      showWelcomeWizard: false,
      setShowWelcomeWizard: (state) => set({ showWelcomeWizard: state }),

      showSolarSystem: false,
      setShowSolarSystem: (state) => set({ showSolarSystem: state }),
    }),
    {
      name: 'starship-ui-storage',
      partialize: (state) => ({
        activeView: state.activeView,
        layoutMode: state.layoutMode,
      }),
    },
  ),
);
