import html2canvas from 'html2canvas';
import {
  ArrowLeftRight,
  Globe,
  Keyboard,
  Menu,
  Monitor,
  Redo,
  Save,
  Settings,
  Smartphone,
  Undo,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { AuthModal } from './components/AuthModal';
import { CommandPalette } from './components/CommandPalette';
import { ComparisonView } from './components/ComparisonView';
import { DynamicThemeSettingsModal } from './components/DynamicThemeSettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExportImport } from './components/ExportImport';
import { FontSelector } from './components/FontSelector';
import { GlobalFormatControls } from './components/GlobalFormatControls';
import { ImagePalette } from './components/ImagePalette';
import { ModuleConfig } from './components/ModuleConfig';
import { ModuleList } from './components/ModuleList';
import { SolarSystem } from './components/SolarSystem';
import { SuggestionPanel } from './components/SuggestionPanel';
import { TerminalPreview } from './components/TerminalPreview';
import { ThemeGallery } from './components/ThemeGallery';
import { ThemeUploadModal } from './components/ThemeUploadModal';
import { WelcomeWizard } from './components/WelcomeWizard';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { useDynamicTheme } from './hooks/useDynamicTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { cn } from './lib/utils';
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

  const isUndoPossible = canUndo();
  const isRedoPossible = canRedo();

  const {
    showExportImport,
    setShowExportImport,
    showGallery,
    setShowGallery,
    showComparison,
    setShowComparison,
    showCommandPalette,
    setShowCommandPalette,
    showDynamicThemeSettings,
    setShowDynamicThemeSettings,
    showSolarSystem,
    setShowSolarSystem,
    layoutMode,
    setLayoutMode,
  } = useUIStore();

  const { addToast } = useToast();
  const [themeName, setThemeName] = useState(
    currentTheme.metadata.name || 'My Awesome Theme',
  );

  // Derive effective layout mode
  const isMobileLayout =
    layoutMode === 'mobile' ||
    (layoutMode === 'auto' && window.innerWidth <= 1024);
  const isDesktopLayout =
    layoutMode === 'desktop' ||
    (layoutMode === 'auto' && window.innerWidth > 1024);

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(isDesktopLayout);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(
    isDesktopLayout && window.innerWidth > 1280,
  );

  // Sync sidebars when layout mode changes
  useEffect(() => {
    if (layoutMode === 'desktop') {
      setLeftSidebarOpen(true);
      setRightSidebarOpen(window.innerWidth > 1280);
    } else if (layoutMode === 'mobile') {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }
  }, [layoutMode]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
  } | null>(null);

  useDynamicTheme();

  useEffect(() => {
    setThemeName(currentTheme.metadata.name || 'My Awesome Theme');
  }, [currentTheme.metadata.id, currentTheme.metadata.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setThemeName(newName);
    updateMetadata({ name: newName });
  };

  const handleSave = async () => {
    try {
      const element = document.getElementById(
        'terminal-preview-capture-source',
      );
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 0.8,
          logging: false,
          useCORS: true,
        });
        const previewImage = canvas.toDataURL('image/jpeg', 0.5);
        saveTheme(previewImage);
        addToast('Theme saved successfully!', 'success');
      } else {
        saveTheme();
        addToast('Theme saved (no preview).', 'info');
      }
    } catch (error) {
      console.error('Failed to capture theme preview:', error);
      saveTheme();
      addToast('Theme saved, but failed to generate preview.', 'info');
    }
  };

  const handleNew = () => {
    if (confirm('Create a new theme? Any unsaved changes will be lost.')) {
      resetTheme();
      setThemeName('Untitled Theme');
      addToast('Started a new theme.', 'info');
    }
  };

  useKeyboardShortcuts([
    { keys: 'mod+s', description: 'Save current theme', handler: handleSave },
    { keys: 'mod+z', description: 'Undo', handler: undo },
    { keys: 'mod+shift+z', description: 'Redo', handler: redo },
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
      <header className="flex h-auto min-h-[4rem] shrink-0 flex-col border-b border-gray-800 bg-[#161b22] px-4 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className={cn(
                'rounded p-2 text-gray-400 hover:bg-gray-800',
                !isMobileLayout && isDesktopLayout && 'lg:hidden',
              )}
            >
              <Menu size={20} />
            </button>
            <span className="text-xl">🚀</span>
            <h1 className="hidden text-lg font-bold text-gray-200 sm:block">
              Starship
            </h1>
          </div>

          <input
            type="text"
            value={themeName}
            onChange={handleNameChange}
            placeholder="Theme Name"
            className="w-full max-w-[200px] rounded border border-gray-700 bg-[#0d1117] px-3 py-1.5 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
          />

          <div className="flex items-center gap-1 xl:hidden">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="rounded p-2 text-gray-400 hover:bg-gray-800"
            >
              <Keyboard size={18} />
            </button>
            <button
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className={cn(
                'rounded p-2 text-gray-400 hover:bg-gray-800',
                isDesktopLayout && 'xl:hidden',
              )}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:mt-0 sm:justify-end">
          {/* Layout Switcher */}
          <div className="flex items-center rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setLayoutMode('mobile')}
              className={cn(
                'rounded px-2 py-1 transition-colors',
                layoutMode === 'mobile'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200',
              )}
              title="Mobile Mode"
            >
              <Smartphone size={16} />
            </button>
            <button
              onClick={() => setLayoutMode('auto')}
              className={cn(
                'rounded px-2 py-1 text-[10px] font-bold transition-colors',
                layoutMode === 'auto'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200',
              )}
              title="Auto Layout"
            >
              AUTO
            </button>
            <button
              onClick={() => setLayoutMode('desktop')}
              className={cn(
                'rounded px-2 py-1 transition-colors',
                layoutMode === 'desktop'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200',
              )}
              title="Desktop Mode"
            >
              <Monitor size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1 border-r border-gray-700 pr-2">
            <button
              onClick={undo}
              disabled={!isUndoPossible}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-800 disabled:opacity-30"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={redo}
              disabled={!isRedoPossible}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-800 disabled:opacity-30"
            >
              <Redo size={16} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
          >
            <Save size={14} className="xs:block hidden" /> Save
          </button>

          <button
            onClick={() => setShowGallery(true)}
            className="rounded bg-gray-800 px-3 py-1.5 text-xs font-medium hover:bg-gray-700"
          >
            Gallery
          </button>

          <div className="hidden gap-2 md:flex">
            <button
              onClick={() => setShowSolarSystem(true)}
              className="flex items-center gap-2 rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium hover:bg-indigo-500"
            >
              <Globe size={14} /> Community
            </button>
            <button
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-2 rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeftRight size={14} /> Compare
            </button>
          </div>

          <button
            onClick={() => setShowDynamicThemeSettings(true)}
            className="hidden rounded-full p-2 text-gray-400 hover:bg-gray-800 xl:block"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside
          className={cn(
            'absolute inset-y-0 left-0 z-40 w-72 shrink-0 flex-col overflow-y-auto border-r border-gray-800 bg-[#161b22] transition-transform duration-300',
            isDesktopLayout
              ? 'relative translate-x-0'
              : leftSidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full',
          )}
        >
          <div className="p-4">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Modules
            </h2>
            <ErrorBoundary>
              <ModuleList />
            </ErrorBoundary>
          </div>
          <div className="border-t border-gray-800 p-4">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Colors
            </h2>
            <ErrorBoundary>
              <ImagePalette />
            </ErrorBoundary>
          </div>
          <div className="border-t border-gray-800 p-4">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Font
            </h2>
            <ErrorBoundary>
              <FontSelector
                currentFont={currentTheme.metadata.fontFamily || 'FiraCode NF'}
                onSelectFont={(font) => updateMetadata({ fontFamily: font })}
              />
            </ErrorBoundary>
          </div>
        </aside>

        {/* CENTER - TERMINAL */}
        <main className="relative flex flex-1 flex-col overflow-y-auto bg-[#0d1117] p-4 sm:p-8">
          <div className="bg-grid-white/[0.02] pointer-events-none absolute inset-0 -z-10" />
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
            <ErrorBoundary>
              <TerminalPreview
                id="terminal-preview-capture-source"
                className="w-full shadow-2xl"
                fontFamily={currentTheme.metadata.fontFamily}
              />
            </ErrorBoundary>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside
          className={cn(
            'absolute inset-y-0 right-0 z-40 w-80 shrink-0 flex-col overflow-y-auto border-l border-gray-800 bg-[#161b22] transition-transform duration-300',
            isDesktopLayout && window.innerWidth > 1280
              ? 'relative translate-x-0'
              : rightSidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full',
          )}
        >
          <div className="p-4">
            <ErrorBoundary>
              {selectedModule ? (
                <ModuleConfig />
              ) : (
                <div className="flex flex-col items-center justify-center rounded border border-dashed border-gray-700 py-12 text-center text-sm text-gray-500">
                  <span className="mb-2 text-2xl">⚙️</span>
                  Select a module to configure
                </div>
              )}
            </ErrorBoundary>
            <div className="mt-6 border-t border-gray-800 pt-6">
              <ErrorBoundary>
                <GlobalFormatControls />
              </ErrorBoundary>
            </div>
            <ErrorBoundary>
              <SuggestionPanel />
            </ErrorBoundary>
          </div>
        </aside>

        {/* Overlay for mobile sidebars */}
        {(leftSidebarOpen || rightSidebarOpen) && !isDesktopLayout && (
          <div
            className="absolute inset-0 z-30 bg-black/50"
            onClick={() => {
              setLeftSidebarOpen(false);
              setRightSidebarOpen(false);
            }}
          />
        )}
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

      {showSolarSystem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <ErrorBoundary>
            <SolarSystem onClose={() => setShowSolarSystem(false)} />
          </ErrorBoundary>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <ErrorBoundary>
            <AuthModal
              onClose={() => setShowAuthModal(false)}
              onLoginSuccess={(id, username) => {
                setCurrentUser({ id, username });
                setShowAuthModal(false);
              }}
            />
          </ErrorBoundary>
        </div>
      )}

      {showUploadModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <ErrorBoundary>
            <ThemeUploadModal
              onClose={() => setShowUploadModal(false)}
              userId={currentUser.id}
            />
          </ErrorBoundary>
        </div>
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
          <ConfirmationProvider>
            <AppContent />
          </ConfirmationProvider>
        </ToastProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
