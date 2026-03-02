import {
  CheckCircle2,
  ChevronRight,
  Settings,
  Terminal,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { PRESET_THEMES } from '../../lib/presets';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../stores/theme-store';
import { Theme } from '../../types/starship.types';

export function WelcomeWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { loadTheme } = useThemeStore();

  useEffect(() => {
    // Check if it's the user's first time
    const hasSeenWizard = localStorage.getItem('starship_wizard_completed');
    if (!hasSeenWizard) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('starship_wizard_completed', 'true');
    setIsOpen(false);
  };

  const handleSelectPreset = (theme: Theme) => {
    loadTheme(theme);
    setStep(3); // skip to next
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex h-[600px] w-full max-w-4xl overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Left pane - Progress */}
        <div className="flex w-64 flex-col border-r border-gray-800 bg-gray-900/50 p-6">
          <div className="mb-8 flex items-center gap-2 font-bold text-white">
            <span className="text-2xl">🚀</span> Starship
          </div>

          <div className="flex flex-col gap-6">
            <div
              className={cn(
                'flex items-center gap-3',
                step >= 1 ? 'text-blue-400' : 'text-gray-600',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border',
                  step >= 1
                    ? 'border-blue-400 bg-blue-900/20'
                    : 'border-gray-700',
                )}
              >
                1
              </div>
              <span className="font-medium">Welcome</span>
            </div>
            <div
              className={cn(
                'flex items-center gap-3',
                step >= 2 ? 'text-blue-400' : 'text-gray-600',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border',
                  step >= 2
                    ? 'border-blue-400 bg-blue-900/20'
                    : 'border-gray-700',
                )}
              >
                2
              </div>
              <span className="font-medium">Choose Starting Point</span>
            </div>
            <div
              className={cn(
                'flex items-center gap-3',
                step >= 3 ? 'text-blue-400' : 'text-gray-600',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border',
                  step >= 3
                    ? 'border-blue-400 bg-blue-900/20'
                    : 'border-gray-700',
                )}
              >
                3
              </div>
              <span className="font-medium">Ready</span>
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={handleComplete}
              className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-300"
            >
              Skip Wizard
            </button>
          </div>
        </div>

        {/* Right pane - Content */}
        <div className="relative flex flex-1 flex-col p-8">
          <button
            onClick={handleComplete}
            className="absolute right-4 top-4 text-gray-500 hover:text-white"
            aria-label="Close Wizard"
          >
            <X size={20} />
          </button>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 flex flex-1 flex-col justify-center duration-500">
              <h2 className="mb-4 text-3xl font-bold text-white">
                Create Your Perfect Terminal
              </h2>
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-gray-400">
                Welcome to the visual theme creator for Starship. Build,
                customize, and preview cross-shell prompts without touching a
                single TOML file manually.
              </p>

              <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <Terminal className="mb-2 text-blue-400" size={24} />
                  <h3 className="font-semibold text-gray-200">Live Preview</h3>
                  <p className="text-sm text-gray-500">
                    See your prompt exactly as it will appear in your terminal.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <Settings className="mb-2 text-purple-400" size={24} />
                  <h3 className="font-semibold text-gray-200">Drag & Drop</h3>
                  <p className="text-sm text-gray-500">
                    Reorder modules visually and customize their behavior.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 self-start rounded bg-blue-600 px-6 py-3 font-medium text-white transition-all hover:bg-blue-500"
              >
                Get Started <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 flex flex-1 flex-col duration-500">
              <h2 className="mb-2 text-2xl font-bold text-white">
                Choose a Starting Point
              </h2>
              <p className="mb-6 text-gray-400">
                Select a preset to customize, or start from scratch.
              </p>

              <div className="scrollbar-thin scrollbar-thumb-gray-700 grid flex-1 grid-cols-2 gap-4 overflow-y-auto pr-2">
                {PRESET_THEMES.slice(0, 6).map((theme) => (
                  <div
                    key={theme.metadata.id}
                    onClick={() => handleSelectPreset(theme)}
                    className="group cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-4 transition-all hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/20"
                  >
                    <h3 className="font-semibold text-gray-200 group-hover:text-blue-400">
                      {theme.metadata.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {theme.metadata.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 flex flex-1 flex-col items-center justify-center text-center duration-500">
              <div className="mb-6 rounded-full bg-green-900/30 p-4">
                <CheckCircle2 className="text-green-500" size={48} />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-white">
                You're All Set!
              </h2>
              <p className="mb-8 max-w-md text-gray-400">
                Your workspace is ready. You can now use the drag-and-drop
                builder, pick colors, and preview your changes in real-time.
              </p>
              <button
                onClick={handleComplete}
                className="rounded bg-blue-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500"
              >
                Go to Editor
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
