import {
  ArrowLeftRight,
  Keyboard,
  Redo,
  Settings,
  Undo,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { CommandPalette } from './components/CommandPalette';
import { ComparisonView } from './components/ComparisonView';
import { DynamicThemeSettingsModal } from './components/DynamicThemeSettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExportImport } from './components/ExportImport';
import { ImagePalette } from './components/ImagePalette';
import { ModuleConfig } from './components/ModuleConfig';
import { ModuleList } from './components/ModuleList';
import { SuggestionPanel } from './components/SuggestionPanel';
import { TerminalPreview } from './components/TerminalPreview';
import { ThemeGallery } from './components/ThemeGallery';
import { WelcomeWizard } from './components/WelcomeWizard';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { useDynamicTheme } from './hooks/useDynamicTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useThemeStore } from './stores/theme-store';
import { useUIStore } from './stores/ui-store';

function AppContent() {
  const {
    currentTheme,
    selectedModule,
    updateMetadata,
    saveTheme,
    resetTheme,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useThemeStore();

  const {
    showExportImport,
    setShowExportImport,
    showGallery,
    setShowGallery,
    showComparison,
    setShowComparison,
    showCommandPalette,
    setShowCommandPalette,
  } = useUIStore();

  const { addToast } = useToast();
  const [showDynamicThemeSettings, setShowDynamicThemeSettings] =
    useState(false);
  const [themeName, setThemeName] = useState(
    currentTheme.metadata.name || 'My Awesome Theme',
  );

  // Activate dynamic theme switching
  useDynamicTheme();

  // Sync local theme name state with store when loaded from somewhere else
  useEffect(() => {
    setThemeName(currentTheme.metadata.name || 'My Awesome Theme');
  }, [currentTheme.metadata.id, currentTheme.metadata.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setThemeName(newName);
    updateMetadata({ name: newName });
  };

  const handleSave = () => {
    saveTheme();
    addToast('Theme saved successfully!', 'success');
  };

  const handleNew = () => {
    if (confirm('Create a new theme? Any unsaved changes will be lost.')) {
      resetTheme();
      setThemeName('Untitled Theme');
      addToast('Started a new theme.', 'info');
    }
  };

  useKeyboardShortcuts([
    {
      keys: 'mod+s',
      description: 'Save current theme',
      handler: () => handleSave(),
    },
    {
      keys: 'mod+z',
      description: 'Undo',
      handler: () => undo(),
    },
    {
      keys: 'mod+shift+z',
      description: 'Redo',
      handler: () => redo(),
    },
    {
      keys: 'mod+k',
      description: 'Open Command Palette',
      handler: () => setShowCommandPalette(true),
    },
    {
      keys: 'mod+o',
      description: 'Open Theme Gallery',
      handler: () => setShowGallery(true),
    },
    {
      keys: 'mod+e',
      description: 'Export Theme',
      handler: () => setShowExportImport('export'),
    },
    {
      keys: 'mod+i',
      description: 'Import Theme',
      handler: () => setShowExportImport('import'),
    },
  ]);

  const commandActions = [
    { id: 'save', title: 'Save Theme', shortcut: 'Cmd+S', perform: handleSave },
    { id: 'undo', title: 'Undo', shortcut: 'Cmd+Z', perform: undo },
    { id: 'redo', title: 'Redo', shortcut: 'Cmd+Shift+Z', perform: redo },
    { id: 'new', title: 'New Theme', perform: handleNew },
    {
      id: 'gallery',
      title: 'Open Theme Gallery',
      shortcut: 'Cmd+O',
      perform: () => setShowGallery(true),
    },
    {
      id: 'export',
      title: 'Export Config',
      shortcut: 'Cmd+E',
      perform: () => setShowExportImport('export'),
    },
    {
      id: 'import',
      title: 'Import Config',
      shortcut: 'Cmd+I',
      perform: () => setShowExportImport('import'),
    },
    {
      id: 'compare',
      title: 'Compare Themes',
      perform: () => setShowComparison(true),
    },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d1117] font-sans text-gray-100">
      <WelcomeWizard />
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        actions={commandActions}
      />
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 bg-[#161b22] px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl">🚀</span>
          <h1 className="text-lg font-bold text-gray-200">
            Starship Theme Creator
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={themeName}
            onChange={handleNameChange}
            placeholder="Theme Name"
            className="rounded border border-gray-700 bg-[#0d1117] px-3 py-1.5 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
          />
          <div className="flex items-center border-r border-gray-700 pr-3">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-white disabled:bg-transparent disabled:opacity-30"
              title="Undo (Cmd+Z)"
              aria-label="Undo"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-white disabled:bg-transparent disabled:opacity-30"
              title="Redo (Cmd+Shift+Z)"
              aria-label="Redo"
            >
              <Redo size={18} />
            </button>
          </div>
          <button
            onClick={handleNew}
            className="rounded bg-gray-800 px-4 py-1.5 text-sm font-medium hover:bg-gray-700"
          >
            New
          </button>
          <button
            onClick={() => setShowGallery(true)}
            className="rounded bg-gray-800 px-4 py-1.5 text-sm font-medium hover:bg-gray-700"
          >
            Gallery
          </button>
          <button
            onClick={() => setShowComparison(true)}
            className="flex items-center gap-2 rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeftRight size={14} /> Compare
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Save
          </button>
          <button
            onClick={() => setShowExportImport('import')}
            className="rounded bg-gray-800 px-4 py-1.5 text-sm font-medium hover:bg-gray-700"
          >
            Import
          </button>
          <button
            onClick={() => setShowExportImport('export')}
            className="rounded bg-gray-800 px-4 py-1.5 text-sm font-medium hover:bg-gray-700"
          >
            Export
          </button>
          <button
            onClick={() => setShowCommandPalette(true)}
            className="ml-2 rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Command Palette (Cmd+K)"
            aria-label="Open Command Palette"
          >
            <Keyboard size={16} />
          </button>
          <button
            onClick={() => setShowDynamicThemeSettings(true)}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Dynamic Theme Settings"
            aria-label="Open Dynamic Theme Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-gray-800 bg-[#161b22]">
          <div className="flex items-center justify-between border-b border-gray-800 p-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Modules
            </h2>
            <div className="p-4">
              <ErrorBoundary>
                <ModuleList />
              </ErrorBoundary>
            </div>
          </div>
          <div className="border-b border-gray-800 p-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Colors
            </h2>
            <ErrorBoundary>
              <ImagePalette />
            </ErrorBoundary>
          </div>
        </aside>

        {/* CENTER - TERMINAL */}
        <main className="relative flex flex-1 flex-col overflow-y-auto p-8">
          <div className="bg-grid-white/[0.02] pointer-events-none absolute inset-0 -z-10" />
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
            <ErrorBoundary>
              <TerminalPreview className="w-full shadow-2xl" />
            </ErrorBoundary>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-gray-800 bg-[#161b22] p-4">
          {selectedModule ? (
            <ModuleConfig />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">
              <span className="mb-2 text-2xl">⚙️</span>
              Select a module to configure
            </div>
          )}
          <SuggestionPanel />
        </aside>
      </div>

      {/* MODALS */}
      {showExportImport && (
        <ErrorBoundary>
          <ExportImport
            initialTab={showExportImport}
            onClose={() => setShowExportImport(null)}
          />
        </ErrorBoundary>
      )}

      {showComparison && (
        <ErrorBoundary>
          <ComparisonView onClose={() => setShowComparison(false)} />
        </ErrorBoundary>
      )}

      {showDynamicThemeSettings && (
        <ErrorBoundary>
          <DynamicThemeSettingsModal
            onClose={() => setShowDynamicThemeSettings(false)}
          />
        </ErrorBoundary>
      )}

      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-800/50 p-4">
              <h2 className="text-lg font-bold text-white">Theme Gallery</h2>
              <button
                onClick={() => setShowGallery(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ErrorBoundary>
                <ThemeGallery onSelect={() => setShowGallery(false)} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
