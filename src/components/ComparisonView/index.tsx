import html2canvas from 'html2canvas';
import { ArrowLeftRight, Camera, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { useToast } from '../../contexts/ToastContext';
import { PRESET_THEMES } from '../../lib/presets';
import { TomlParser } from '../../lib/toml-parser';
import { useThemeStore } from '../../stores/theme-store';
import { Theme } from '../../types/starship.types';

interface ComparisonViewProps {
  onClose: () => void;
}

export function ComparisonView({ onClose }: ComparisonViewProps) {
  const { currentTheme, savedThemes } = useThemeStore();
  const { addToast } = useToast();

  const allThemes = [currentTheme, ...savedThemes, ...PRESET_THEMES];

  // By default compare current vs a clean preset or the first saved theme
  const [themeA, setThemeA] = useState<Theme>(currentTheme);
  const [themeB, setThemeB] = useState<Theme>(
    savedThemes[0] || PRESET_THEMES[0],
  );

  const comparisonRef = useRef<HTMLDivElement>(null);

  const handleSwap = () => {
    setThemeA(themeB);
    setThemeB(themeA);
  };

  const handleExportImage = async () => {
    if (!comparisonRef.current) return;

    try {
      const canvas = await html2canvas(comparisonRef.current, {
        backgroundColor: '#0d1117',
        scale: 2,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `comparison-${themeA.metadata.name}-vs-${themeB.metadata.name}.png`;
      link.click();
      addToast('Comparison image downloaded!', 'success');
    } catch (err) {
      addToast('Failed to generate image', 'error');
    }
  };

  // Calculate basic stats for diff
  const getModulesLength = (theme: Theme) => {
    return Object.keys(theme.config).filter((k) => {
      if (k === 'format') return false;
      const val = theme.config[k];
      if (typeof val === 'object' && val !== null && 'disabled' in val) {
        return (val as { disabled?: boolean }).disabled !== true;
      }
      return true;
    }).length;
  };

  const modulesA = getModulesLength(themeA);
  const modulesB = getModulesLength(themeB);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-800/50 p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <ArrowLeftRight size={20} className="text-blue-500" />
            Theme Comparison
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportImage}
              className="flex items-center gap-2 rounded bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-200 hover:bg-gray-600"
            >
              <Camera size={16} /> Screenshot
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex flex-1 flex-col overflow-y-auto p-6"
          ref={comparisonRef}
        >
          {/* Controls */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="flex-1">
              <select
                value={themeA.metadata.id}
                onChange={(e) =>
                  setThemeA(
                    allThemes.find((t) => t.metadata.id === e.target.value) ||
                      themeA,
                  )
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {allThemes.map((t) => (
                  <option key={`a-${t.metadata.id}`} value={t.metadata.id}>
                    {t.metadata.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSwap}
              className="rounded-full bg-gray-800 p-3 text-gray-400 transition-transform hover:bg-gray-700 hover:text-white active:scale-95"
              aria-label="Swap themes"
            >
              <ArrowLeftRight size={20} />
            </button>

            <div className="flex-1">
              <select
                value={themeB.metadata.id}
                onChange={(e) =>
                  setThemeB(
                    allThemes.find((t) => t.metadata.id === e.target.value) ||
                      themeB,
                  )
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {allThemes.map((t) => (
                  <option key={`b-${t.metadata.id}`} value={t.metadata.id}>
                    {t.metadata.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Terminals */}
          <div className="grid flex-1 grid-cols-2 gap-6">
            {/* Theme A */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <h3 className="font-semibold text-gray-200">
                  {themeA.metadata.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Active Modules: {modulesA}
                </p>
              </div>
              <div className="pointer-events-none relative flex-1">
                {/* We need to pass the specific theme to a modified TerminalPreview, 
                    but since it relies on store state, we will render a static mock block 
                    or temporary local override if possible. For now, we show a simplified TOML diff */}
                <div className="h-full overflow-y-auto whitespace-pre rounded-lg border border-gray-700 bg-[#1e1e1e] p-4 font-mono text-xs text-gray-300">
                  {TomlParser.stringify(themeA.config)}
                </div>
              </div>
            </div>

            {/* Theme B */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <h3 className="font-semibold text-gray-200">
                  {themeB.metadata.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Active Modules: {modulesB}
                </p>
              </div>
              <div className="pointer-events-none relative flex-1">
                <div className="h-full overflow-y-auto whitespace-pre rounded-lg border border-gray-700 bg-[#1e1e1e] p-4 font-mono text-xs text-gray-300">
                  {TomlParser.stringify(themeB.config)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
