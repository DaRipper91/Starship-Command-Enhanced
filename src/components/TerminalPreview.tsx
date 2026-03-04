import 'xterm/css/xterm.css';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

import { useDebounce } from '../hooks/useDebounce';
import { ColorUtils } from '../lib/color-utils';
import { parseFormattedString } from '../lib/format-parser';
import { MOCK_SCENARIOS } from '../lib/mock-data';
import { translateThemeToXterm } from '../lib/theme-to-xterm';
import { cn } from '../lib/utils';
import { useThemeStore } from '../stores/theme-store';
import { StarshipConfig } from '../types/starship.types';

// This is a simplified version of a style-to-ANSI converter.
// A more complete implementation would require a full color parsing library.
function styleToAnsi(style: string, config: StarshipConfig): string {
  if (!style) return '';

  const paletteName = config.palette || 'global';
  const customPalette = config.palettes?.[paletteName] || {};
  const parts = style.split(/\s+/);
  const codes: string[] = [];

  parts.forEach((part) => {
    if (part === 'bold') codes.push('1');
    else if (part === 'italic') codes.push('3');
    else if (part === 'underline') codes.push('4');
    else if (part === 'dimmed') codes.push('2');
    else if (part.startsWith('bg:')) {
      const color = ColorUtils.resolveColor(part.substring(3), customPalette);
      const rgb = ColorUtils.hexToRgb(color);
      if (rgb) codes.push(`48;2;${rgb.r};${rgb.g};${rgb.b}`);
    } else {
      const color = ColorUtils.resolveColor(part, customPalette);
      const rgb = ColorUtils.hexToRgb(color);
      if (rgb) codes.push(`38;2;${rgb.r};${rgb.g};${rgb.b}`);
    }
  });

  if (codes.length === 0) return '';
  return `\x1b[${codes.join(';')}m`;
}

interface TerminalPreviewProps {
  className?: string;
  fontFamily?: string;
  id?: string;
}

export const TerminalPreview: React.FC<TerminalPreviewProps> = ({
  className,
  fontFamily,
  id,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const { currentTheme } = useThemeStore();
  const [scenarioIndex, setScenarioIndex] = useState(0);

  const scenarioKeys = Object.keys(MOCK_SCENARIOS);

  useEffect(() => {
    // Cycle through scenarios every 5 seconds
    const interval = setInterval(() => {
      setScenarioIndex((prev) => (prev + 1) % scenarioKeys.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [scenarioKeys.length]);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new Terminal({
      fontFamily:
        fontFamily || '"FiraCode NF", Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      allowProposedApi: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    try {
      fitAddon.fit();
    } catch (e) {
      console.warn('Initial fit failed:', e);
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        /* ignore */
      }
    });
    resizeObserver.observe(terminalRef.current);
    resizeObserverRef.current = resizeObserver;

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
    };
  }, [fontFamily]); // Re-run effect if fontFamily changes

  // Effect to update font-family if it changes after initial render
  useEffect(() => {
    const term = xtermRef.current;
    if (term && fontFamily) {
      term.options.fontFamily = fontFamily;
    }
  }, [fontFamily]);

  const debouncedConfig = useDebounce(currentTheme.config, 200);

  const segments = useMemo(() => {
    const format = debouncedConfig.format || '';
    const currentScenarioKey = scenarioKeys[scenarioIndex];
    const scenario = MOCK_SCENARIOS[currentScenarioKey];
    return parseFormattedString(format, debouncedConfig, scenario);
  }, [debouncedConfig, scenarioIndex, scenarioKeys]);

  // Effect to update theme and content
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    // Apply the theme
    const xtermTheme = translateThemeToXterm(debouncedConfig);
    term.options.theme = xtermTheme;

    // Write content
    term.reset();
    segments.forEach((segment) => {
      const ansi = styleToAnsi(segment.style, debouncedConfig);
      term.write(ansi + segment.text + (ansi ? '\x1b[0m' : ''));
    });
  }, [segments, debouncedConfig]);

  const terminalBg = useMemo(() => {
    return translateThemeToXterm(debouncedConfig).background || '#1e1e1e';
  }, [debouncedConfig]);

  return (
    <div
      id={id}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-gray-700 shadow-2xl',
        className,
      )}
      style={{ backgroundColor: terminalBg }}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-700 bg-gray-800/50 px-4 py-2">
        <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <div className="ml-4 select-none text-xs font-medium text-gray-400">
          Terminal Preview ({MOCK_SCENARIOS[scenarioKeys[scenarioIndex]].name})
        </div>
      </div>

      <div className="relative min-h-[200px] flex-1 p-1">
        <div ref={terminalRef} className="absolute inset-0" />
      </div>
    </div>
  );
};
