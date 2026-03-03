# Starship Theme Creator - Base Code Templates

## Project Structure

```
starship-theme-creator/
├── public/
│   ├── nerd-fonts/          # Nerd font subset
│   └── sample-themes/       # Example .toml files
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── ColorPicker/
│   │   ├── IconBrowser/
│   │   ├── ModuleBuilder/
│   │   ├── TerminalPreview/
│   │   └── ThemeGallery/
│   ├── lib/
│   │   ├── toml-parser.ts
│   │   ├── color-utils.ts
│   │   └── starship-schema.ts
│   ├── stores/
│   │   └── theme-store.ts
│   ├── hooks/
│   │   └── use-theme.ts
│   ├── types/
│   │   └── starship.types.ts
│   └── App.tsx
├── package.json
└── vite.config.ts
```

---

## 1. TypeScript Types (src/types/starship.types.ts)

```typescript
// Core Starship configuration types
export interface StarshipConfig {
  format?: string;
  right_format?: string;
  continuation_prompt?: string;
  scan_timeout?: number;
  command_timeout?: number;
  add_newline?: boolean;
  palette?: Record<string, string>;
  palettes?: Record<string, Record<string, string>>;

  // Modules
  aws?: ModuleConfig;
  battery?: BatteryModuleConfig;
  character?: CharacterModuleConfig;
  directory?: DirectoryModuleConfig;
  git_branch?: GitBranchModuleConfig;
  git_status?: GitStatusModuleConfig;
  nodejs?: ModuleConfig;
  python?: ModuleConfig;
  rust?: ModuleConfig;
  time?: TimeModuleConfig;
  // ... add all other modules

  [key: string]: any;
}

export interface ModuleConfig {
  format?: string;
  style?: string;
  symbol?: string;
  disabled?: boolean;
  detect_extensions?: string[];
  detect_files?: string[];
  detect_folders?: string[];
  when?: string;
}

export interface CharacterModuleConfig extends ModuleConfig {
  success_symbol?: string;
  error_symbol?: string;
  vimcmd_symbol?: string;
  vimcmd_visual_symbol?: string;
  vimcmd_replace_symbol?: string;
  vimcmd_replace_one_symbol?: string;
}

export interface DirectoryModuleConfig extends ModuleConfig {
  truncation_length?: number;
  truncate_to_repo?: boolean;
  fish_style_pwd_dir_length?: number;
  use_logical_path?: boolean;
  read_only?: string;
  home_symbol?: string;
}

export interface GitBranchModuleConfig extends ModuleConfig {
  always_show_remote?: boolean;
  truncation_length?: number;
  truncation_symbol?: string;
  only_attached?: boolean;
  ignore_branches?: string[];
}

export interface GitStatusModuleConfig extends ModuleConfig {
  conflicted?: string;
  ahead?: string;
  behind?: string;
  diverged?: string;
  up_to_date?: string;
  untracked?: string;
  stashed?: string;
  modified?: string;
  staged?: string;
  renamed?: string;
  deleted?: string;
}

export interface BatteryModuleConfig extends ModuleConfig {
  full_symbol?: string;
  charging_symbol?: string;
  discharging_symbol?: string;
  unknown_symbol?: string;
  empty_symbol?: string;
  display?: BatteryDisplay[];
}

export interface BatteryDisplay {
  threshold: number;
  style: string;
  charging_symbol?: string;
  discharging_symbol?: string;
}

export interface TimeModuleConfig extends ModuleConfig {
  time_format?: string;
  use_12hr?: boolean;
  time_range?: string;
  utc_time_offset?: string;
}

// Color palette types
export interface ColorPalette {
  name: string;
  colors: Record<string, string>;
  source?: 'preset' | 'image' | 'custom';
}

// Theme metadata
export interface ThemeMetadata {
  id?: string;
  name: string;
  author?: string;
  description?: string;
  tags?: string[];
  created?: Date;
  updated?: Date;
  downloads?: number;
  likes?: number;
  screenshot?: string;
}

export interface Theme {
  metadata: ThemeMetadata;
  config: StarshipConfig;
}
```

---

## 2. TOML Parser (src/lib/toml-parser.ts)

```typescript
import TOML from '@iarna/toml';
import { StarshipConfig } from '../types/starship.types';

export class TomlParser {
  /**
   * Parse TOML string to StarshipConfig
   */
  static parse(tomlString: string): StarshipConfig {
    try {
      return TOML.parse(tomlString) as StarshipConfig;
    } catch (error) {
      console.error('Failed to parse TOML:', error);
      throw new Error('Invalid TOML format');
    }
  }

  /**
   * Convert StarshipConfig to TOML string
   */
  static stringify(config: StarshipConfig): string {
    try {
      return TOML.stringify(config as any);
    } catch (error) {
      console.error('Failed to stringify config:', error);
      throw new Error('Failed to generate TOML');
    }
  }

  /**
   * Get default Starship configuration
   */
  static getDefaultConfig(): StarshipConfig {
    return {
      format: '$all',
      add_newline: true,
      character: {
        success_symbol: '[➜](bold green)',
        error_symbol: '[✗](bold red)',
      },
      directory: {
        truncation_length: 3,
        truncate_to_repo: true,
      },
      git_branch: {
        symbol: ' ',
        format: 'on [$symbol$branch]($style) ',
      },
      git_status: {
        format: '([$all_status$ahead_behind]($style) )',
      },
      nodejs: {
        symbol: ' ',
        format: 'via [$symbol($version )]($style)',
      },
      python: {
        symbol: ' ',
        format: 'via [$symbol($version )]($style)',
      },
      rust: {
        symbol: ' ',
        format: 'via [$symbol($version )]($style)',
      },
    };
  }

  /**
   * Validate config against schema
   */
  static validate(config: StarshipConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for common issues
    if (config.format && !config.format.includes('$')) {
      errors.push('Format string should contain module placeholders');
    }

    // Validate colors
    const validateColor = (style: string, path: string) => {
      if (!style) return;

      const colorRegex = /(#[0-9a-fA-F]{6}|rgb\(\d+,\s*\d+,\s*\d+\)|[a-z]+)/;
      if (!colorRegex.test(style)) {
        errors.push(`Invalid color format at ${path}: ${style}`);
      }
    };

    // Validate module styles
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'style' in value) {
        validateColor(value.style as string, key);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge configs (for presets)
   */
  static merge(
    base: StarshipConfig,
    override: Partial<StarshipConfig>,
  ): StarshipConfig {
    return {
      ...base,
      ...override,
      // Deep merge module configs
      ...Object.keys(override).reduce((acc, key) => {
        if (
          typeof override[key] === 'object' &&
          !Array.isArray(override[key])
        ) {
          acc[key] = { ...base[key], ...override[key] };
        }
        return acc;
      }, {} as any),
    };
  }
}
```

---

## 3. Color Utilities (src/lib/color-utils.ts)

```typescript
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import Vibrant from 'node-vibrant';

extend([a11yPlugin]);

export class ColorUtils {
  /**
   * Extract color palette from image
   */
  static async extractPaletteFromImage(
    imageFile: File,
  ): Promise<Record<string, string>> {
    const imageUrl = URL.createObjectURL(imageFile);

    try {
      const vibrant = new Vibrant(imageUrl);
      const palette = await vibrant.getPalette();

      return {
        primary: palette.Vibrant?.hex || '#000000',
        secondary: palette.Muted?.hex || '#666666',
        accent: palette.LightVibrant?.hex || '#ff00ff',
        background: palette.DarkMuted?.hex || '#1a1a1a',
        foreground: palette.LightMuted?.hex || '#ffffff',
        success: palette.Vibrant?.hex || '#00ff00',
        error: '#ff0000',
        warning: '#ffaa00',
      };
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  /**
   * Generate complementary colors
   */
  static generateComplementary(baseColor: string): string[] {
    const color = colord(baseColor);
    return [
      color.toHex(),
      color.rotate(180).toHex(),
      color.rotate(120).toHex(),
      color.rotate(240).toHex(),
    ];
  }

  /**
   * Generate analogous colors
   */
  static generateAnalogous(baseColor: string): string[] {
    const color = colord(baseColor);
    return [color.rotate(-30).toHex(), color.toHex(), color.rotate(30).toHex()];
  }

  /**
   * Generate triadic colors
   */
  static generateTriadic(baseColor: string): string[] {
    const color = colord(baseColor);
    return [
      color.toHex(),
      color.rotate(120).toHex(),
      color.rotate(240).toHex(),
    ];
  }

  /**
   * Check WCAG contrast ratio
   */
  static checkContrast(
    foreground: string,
    background: string,
  ): {
    ratio: number;
    AA: boolean;
    AAA: boolean;
  } {
    const fg = colord(foreground);
    const bg = colord(background);
    const ratio = fg.contrast(bg);

    return {
      ratio,
      AA: ratio >= 4.5,
      AAA: ratio >= 7,
    };
  }

  /**
   * Convert color to ANSI style string
   */
  static toAnsiStyle(color: string, bold = false, italic = false): string {
    const styles = [];

    if (bold) styles.push('bold');
    if (italic) styles.push('italic');

    styles.push(color);

    return styles.join(' ');
  }

  /**
   * Preset color schemes
   */
  static presets = {
    nord: {
      name: 'Nord',
      colors: {
        background: '#2E3440',
        foreground: '#ECEFF4',
        primary: '#88C0D0',
        secondary: '#81A1C1',
        accent: '#B48EAD',
        success: '#A3BE8C',
        error: '#BF616A',
        warning: '#EBCB8B',
      },
    },
    dracula: {
      name: 'Dracula',
      colors: {
        background: '#282A36',
        foreground: '#F8F8F2',
        primary: '#BD93F9',
        secondary: '#6272A4',
        accent: '#FF79C6',
        success: '#50FA7B',
        error: '#FF5555',
        warning: '#F1FA8C',
      },
    },
    gruvbox: {
      name: 'Gruvbox',
      colors: {
        background: '#282828',
        foreground: '#EBDBB2',
        primary: '#FABD2F',
        secondary: '#83A598',
        accent: '#D3869B',
        success: '#B8BB26',
        error: '#FB4934',
        warning: '#FE8019',
      },
    },
    catppuccin: {
      name: 'Catppuccin Mocha',
      colors: {
        background: '#1E1E2E',
        foreground: '#CDD6F4',
        primary: '#89B4FA',
        secondary: '#74C7EC',
        accent: '#F5C2E7',
        success: '#A6E3A1',
        error: '#F38BA8',
        warning: '#F9E2AF',
      },
    },
    tokyo: {
      name: 'Tokyo Night',
      colors: {
        background: '#1A1B26',
        foreground: '#C0CAF5',
        primary: '#7AA2F7',
        secondary: '#BB9AF7',
        accent: '#FF9E64',
        success: '#9ECE6A',
        error: '#F7768E',
        warning: '#E0AF68',
      },
    },
  };
}
```

---

## 4. Theme Store (src/stores/theme-store.ts)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StarshipConfig, Theme, ThemeMetadata } from '../types/starship.types';
import { TomlParser } from '../lib/toml-parser';

interface ThemeStore {
  currentTheme: Theme;
  savedThemes: Theme[];

  // Actions
  updateConfig: (config: Partial<StarshipConfig>) => void;
  updateMetadata: (metadata: Partial<ThemeMetadata>) => void;
  loadTheme: (theme: Theme) => void;
  saveTheme: () => void;
  deleteTheme: (id: string) => void;
  resetTheme: () => void;
  exportToml: () => string;
  importToml: (tomlString: string) => void;
}

const defaultMetadata: ThemeMetadata = {
  name: 'My Theme',
  author: 'Anonymous',
  description: '',
  tags: [],
  created: new Date(),
  updated: new Date(),
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: {
        metadata: defaultMetadata,
        config: TomlParser.getDefaultConfig(),
      },
      savedThemes: [],

      updateConfig: (configUpdate) =>
        set((state) => ({
          currentTheme: {
            ...state.currentTheme,
            config: { ...state.currentTheme.config, ...configUpdate },
            metadata: {
              ...state.currentTheme.metadata,
              updated: new Date(),
            },
          },
        })),

      updateMetadata: (metadataUpdate) =>
        set((state) => ({
          currentTheme: {
            ...state.currentTheme,
            metadata: { ...state.currentTheme.metadata, ...metadataUpdate },
          },
        })),

      loadTheme: (theme) =>
        set({
          currentTheme: theme,
        }),

      saveTheme: () =>
        set((state) => {
          const themeToSave = {
            ...state.currentTheme,
            metadata: {
              ...state.currentTheme.metadata,
              id: state.currentTheme.metadata.id || crypto.randomUUID(),
              updated: new Date(),
            },
          };

          const existingIndex = state.savedThemes.findIndex(
            (t) => t.metadata.id === themeToSave.metadata.id,
          );

          const newSavedThemes = [...state.savedThemes];
          if (existingIndex >= 0) {
            newSavedThemes[existingIndex] = themeToSave;
          } else {
            newSavedThemes.push(themeToSave);
          }

          return { savedThemes: newSavedThemes };
        }),

      deleteTheme: (id) =>
        set((state) => ({
          savedThemes: state.savedThemes.filter((t) => t.metadata.id !== id),
        })),

      resetTheme: () =>
        set({
          currentTheme: {
            metadata: { ...defaultMetadata, created: new Date() },
            config: TomlParser.getDefaultConfig(),
          },
        }),

      exportToml: () => {
        const { currentTheme } = get();
        return TomlParser.stringify(currentTheme.config);
      },

      importToml: (tomlString) => {
        const config = TomlParser.parse(tomlString);
        set({
          currentTheme: {
            metadata: {
              ...defaultMetadata,
              name: 'Imported Theme',
              created: new Date(),
            },
            config,
          },
        });
      },
    }),
    {
      name: 'starship-theme-storage',
    },
  ),
);
```

---

## 5. Terminal Preview Component (src/components/TerminalPreview/index.tsx)

```typescript
import React, { useEffect, useMemo, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useThemeStore } from '../../stores/theme-store';
import { parseFormattedString, styleToAnsi } from '../../lib/format-parser';

export const TerminalPreview: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const { currentTheme } = useThemeStore();

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const terminal = new Terminal({
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
      },
      fontFamily: 'Fira Code, monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Render initial prompt
    renderPrompt(terminal);

    // Cleanup
    return () => {
      terminal.dispose();
    };
  }, []);

  const segments = useMemo(() => {
    const format = currentTheme.config.format || '';
    return parseFormattedString(format, currentTheme.config);
  }, [currentTheme.config]);

  useEffect(() => {
    // Re-render when theme changes
    const term = xtermRef.current;
    if (!term) return;

    term.clear();
    renderPrompt(term);
  }, [segments, currentTheme]);

  const renderPrompt = (terminal: Terminal) => {
    const { config } = currentTheme;
    terminal.writeln('');

    // Dynamic prompt rendering using the format string parser
    segments.forEach((segment) => {
      const ansi = styleToAnsi(segment.style);
      terminal.write(ansi + segment.text + (ansi ? '\x1b[0m' : ''));
    });

    terminal.writeln('');
  };

  return (
    <div className="h-full w-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-gray-400">Terminal Preview</span>
      </div>
      <div ref={terminalRef} className="p-4" style={{ height: 'calc(100% - 40px)' }} />
    </div>
  );
};
```

---

## 6. Color Picker Component (src/components/ColorPicker/index.tsx)

```typescript
import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { ColorUtils } from '../../lib/color-utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  showPalettes?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  label,
  showPalettes = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'picker' | 'palettes'>('picker');

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50"
      >
        <div
          className="w-6 h-6 rounded border"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm">{color}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-white border rounded-lg shadow-lg">
          {showPalettes && (
            <div className="flex gap-2 mb-4 border-b pb-2">
              <button
                onClick={() => setActiveTab('picker')}
                className={`px-3 py-1 text-sm rounded ${
                  activeTab === 'picker' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                }`}
              >
                Picker
              </button>
              <button
                onClick={() => setActiveTab('palettes')}
                className={`px-3 py-1 text-sm rounded ${
                  activeTab === 'palettes' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                }`}
              >
                Palettes
              </button>
            </div>
          )}

          {activeTab === 'picker' && (
            <>
              <HexColorPicker color={color} onChange={onChange} />

              <div className="mt-4">
                <p className="text-xs font-medium mb-2">Suggestions</p>
                <div className="grid grid-cols-4 gap-2">
                  {ColorUtils.generateComplementary(color).map((c) => (
                    <button
                      key={c}
                      onClick={() => onChange(c)}
                      className="w-8 h-8 rounded border hover:scale-110 transition"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'palettes' && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(ColorUtils.presets).map(([key, preset]) => (
                <div key={key}>
                  <p className="text-sm font-medium mb-1">{preset.name}</p>
                  <div className="flex gap-1">
                    {Object.values(preset.colors).map((c, i) => (
                      <button
                        key={i}
                        onClick={() => onChange(c)}
                        className="w-8 h-8 rounded hover:scale-110 transition"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 7. Image to Palette Tool (src/components/ImagePalette/index.tsx)

```typescript
import React, { useState } from 'react';
import { ColorUtils } from '../../lib/color-utils';
import { useThemeStore } from '../../stores/theme-store';

export const ImagePalette: React.FC = () => {
  const [palette, setPalette] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { updateConfig } = useThemeStore();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Extract palette
    setIsLoading(true);
    try {
      const extractedPalette = await ColorUtils.extractPaletteFromImage(file);
      setPalette(extractedPalette);
    } catch (error) {
      console.error('Failed to extract palette:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyPalette = () => {
    if (!palette) return;

    // Apply palette to theme
    updateConfig({
      palette: palette,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Upload Image to Extract Colors
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {preview && (
        <div>
          <img src={preview} alt="Preview" className="max-w-full h-48 object-cover rounded" />
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-500">Extracting colors...</p>}

      {palette && (
        <div className="space-y-3">
          <h3 className="font-medium">Extracted Palette</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(palette).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2 p-2 border rounded">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <p className="text-xs font-medium capitalize">{name}</p>
                  <p className="text-xs text-gray-500">{color}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={applyPalette}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Apply Palette to Theme
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 8. Module Builder Component (src/components/ModuleBuilder/index.tsx)

```typescript
import React from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useThemeStore } from '../../stores/theme-store';

const AVAILABLE_MODULES = [
  'character', 'directory', 'git_branch', 'git_status', 'git_state',
  'nodejs', 'python', 'rust', 'golang', 'java', 'php',
  'docker_context', 'kubernetes', 'aws', 'gcloud',
  'battery', 'time', 'username', 'hostname', 'cmd_duration',
];

interface ModuleItemProps {
  id: string;
  enabled: boolean;
  onToggle: () => void;
}

const ModuleItem: React.FC<ModuleItemProps> = ({ id, enabled, onToggle }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded ${
        enabled ? 'bg-white' : 'bg-gray-50 opacity-50'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing text-gray-400"
      >
        ☰
      </button>

      <input
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
        className="w-4 h-4"
      />

      <span className="flex-1 font-mono text-sm">{id}</span>

      <button className="text-sm text-blue-500 hover:text-blue-700">
        Configure
      </button>
    </div>
  );
};

export const ModuleBuilder: React.FC = () => {
  const { currentTheme, updateConfig } = useThemeStore();
  const [enabledModules, setEnabledModules] = React.useState(
    AVAILABLE_MODULES.filter(m => !currentTheme.config[m]?.disabled)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setEnabledModules((modules) => {
      const oldIndex = modules.indexOf(active.id as string);
      const newIndex = modules.indexOf(over.id as string);
      const newModules = [...modules];
      newModules.splice(oldIndex, 1);
      newModules.splice(newIndex, 0, active.id as string);
      return newModules;
    });

    // Update format string
    updateFormatString();
  };

  const toggleModule = (module: string) => {
    if (enabledModules.includes(module)) {
      setEnabledModules(enabledModules.filter(m => m !== module));
    } else {
      setEnabledModules([...enabledModules, module]);
    }
    updateFormatString();
  };

  const updateFormatString = () => {
    const format = enabledModules.map(m => `$${m}`).join('');
    updateConfig({ format });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Prompt Modules</h3>
        <button className="text-sm text-blue-500">Reset to Default</button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={enabledModules} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {AVAILABLE_MODULES.map((module) => (
              <ModuleItem
                key={module}
                id={module}
                enabled={enabledModules.includes(module)}
                onToggle={() => toggleModule(module)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
```

---

## 9. Export/Import Component (src/components/ExportImport/index.tsx)

```typescript
import React, { useRef } from 'react';
import { useThemeStore } from '../../stores/theme-store';

export const ExportImport: React.FC = () => {
  const { exportToml, importToml } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    const toml = exportToml();
    const blob = new Blob([toml], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'starship.toml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const toml = exportToml();
    navigator.clipboard.writeText(toml);
    // Show toast notification
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        importToml(content);
        // Show success toast
      } catch (error) {
        // Show error toast
      }
    };
    reader.readAsText(file);
  };

  const handleShare = async () => {
    const toml = exportToml();
    const encoded = btoa(toml);
    const url = `${window.location.origin}/theme?data=${encoded}`;

    await navigator.clipboard.writeText(url);
    // Show toast: "Share URL copied!"
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Export Theme</h3>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Download .toml
        </button>

        <button
          onClick={handleCopy}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Copy to Clipboard
        </button>

        <button
          onClick={handleShare}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Share via URL
        </button>
      </div>

      <h3 className="font-medium pt-4">Import Theme</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept=".toml"
        onChange={handleImport}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-4 py-2 border rounded hover:bg-gray-50"
      >
        Import from File
      </button>
    </div>
  );
};
```

---

## 10. Main App Layout (src/App.tsx)

```typescript
import React from 'react';
import { TerminalPreview } from './components/TerminalPreview';
import { ModuleBuilder } from './components/ModuleBuilder';
import { ColorPicker } from './components/ColorPicker';
import { ImagePalette } from './components/ImagePalette';
import { ExportImport } from './components/ExportImport';
import { useThemeStore } from './stores/theme-store';

function App() {
  const { currentTheme, updateConfig } = useThemeStore();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Starship Theme Creator</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              Gallery
            </button>
            <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
              Save Theme
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Configuration */}
        <div className="w-96 border-r overflow-y-auto p-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-4">Modules</h2>
            <ModuleBuilder />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Colors</h2>
            <ImagePalette />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Export/Import</h2>
            <ExportImport />
          </section>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 p-6">
          <TerminalPreview />
        </div>

        {/* Right Sidebar - Module Configuration */}
        <div className="w-80 border-l overflow-y-auto p-6">
          <h2 className="text-lg font-semibold mb-4">Module Settings</h2>
          <p className="text-sm text-gray-500">
            Select a module from the left to configure
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## 11. Package.json

```json
{
  "name": "starship-theme-creator",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@iarna/toml": "^2.2.5",
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "zustand": "^4.4.7",
    "colord": "^2.9.3",
    "node-vibrant": "^3.2.1-alpha.1",
    "react-colorful": "^5.6.1",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

---

## Instructions for Jules

### To get started:

1. **Initialize the project:**

   ```bash
   npm create vite@latest starship-theme-creator -- --template react-ts
   cd starship-theme-creator
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Copy the code templates** from this document into the appropriate files

4. **Set up Tailwind:**

   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

5. **Start development:**
   ```bash
   npm run dev
   ```

### Next Steps for Jules:

1. **Implement format string parser** - Parse Starship's format string syntax and render it properly in the terminal preview
2. **Add proper ANSI color rendering** - Convert color styles to ANSI escape codes
3. **Create module-specific configuration panels** - Each module needs its own config UI
4. **Add icon browser** - Create searchable Nerd Font icon selector
5. **Implement theme gallery** - Backend to store/retrieve community themes
6. **Add validation** - Real-time validation of configuration
7. **Create installation guide** - Help users install their theme

### Critical Features to Focus On:

1. **Terminal Preview Accuracy** - This is the most important feature
2. **Intuitive UI/UX** - Make it easy for non-technical users
3. **Export Quality** - Ensure exported TOML is valid
4. **Performance** - Keep the app fast even with complex themes
