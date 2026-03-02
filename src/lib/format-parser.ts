import {
  BaseModuleConfig,
  CharacterConfig,
  CustomModuleConfig,
  GitStatusConfig,
  StarshipConfig,
} from '../types/starship.types';
import { MOCK_SCENARIOS, MockScenario } from './mock-data';

/**
 * Parses a Starship format string and renders it with ANSI escape codes
 * @param format - The format string (e.g. "[$directory](bold cyan)")
 * @param config - The Starship configuration
 * @param scenario - The mock scenario to use for values (default: clean)
 * @returns Rendered string with ANSI codes
 */
export function parseFormatString(
  format: string,
  config: StarshipConfig,
  scenario: MockScenario = MOCK_SCENARIOS.clean,
): string {
  if (!format) return '';

  let processed = format;

  // Replace module variables ($directory)
  processed = processed.replace(/\$([a-zA-Z0-9_]+)/g, (_match, moduleName) => {
    return renderModule(moduleName, config, scenario);
  });

  // Replace styled groups ([text](style))
  // Iterate to handle nested brackets (limited depth)
  // Use a placeholder for internal [ to avoid breaking the regex match
  let prevProcessed = '';
  let iterations = 0;
  while (processed !== prevProcessed && iterations < 5) {
    prevProcessed = processed;
    processed = processed.replace(
      // eslint-disable-next-line no-useless-escape
      /\[([^\[\]]+)\]\(([^)]+)\)/g,
      (_match, text, style) => {
        const ansi = styleToAnsi(style).replace('[', '\u0001');
        return `${ansi}${text}\x1b\u00010m`;
      },
    );
    iterations++;
  }

  // Restore the [ in ANSI codes
  // eslint-disable-next-line no-control-regex
  processed = processed.replace(/\u0001/g, '[');

  // Handle newlines
  processed = processed.replace(/\\n/g, '\n');

  return processed;
}

/**
 * Renders a specific module based on config and mock data
 * @param moduleName - Name of the module (e.g. "directory")
 * @param config - Starship configuration
 * @param scenario - Mock data scenario
 * @returns Rendered string (plain text, styles applied by parent)
 */
export function renderModule(
  moduleName: string,
  config: StarshipConfig,
  scenario: MockScenario,
): string {
  // Get value from scenario
  const value = scenario.values[moduleName];

  // If no value defined or empty, return empty string (module is hidden)
  if (!value) return '';

  // Get module config
  const moduleConfig = config[moduleName] as BaseModuleConfig &
    Record<string, unknown>;

  // Check if disabled
  if (moduleConfig?.disabled === true) return '';

  // Handle custom modules
  if (moduleName in (config.custom || {})) {
    const customModule = config.custom?.[moduleName] as CustomModuleConfig;
    if (customModule) {
      // For now, we'll mock the output of the command.
      // In a real app, this would involve executing the command.
      const customOutput = scenario.values[moduleName] || '(custom output)';
      const customSymbol = customModule.symbol || '';
      const customStyle = customModule.style || 'white';
      const customFormat = customModule.format || '[$symbol $output]($style) ';

      const output = customFormat
        .replace('$symbol', customSymbol)
        .replace('$output', customOutput)
        .replace('$style', customStyle);

      return output;
    }
  }

  // Special handling for common modules
  if (moduleName === 'directory') {
    const style = moduleConfig?.style || 'cyan bold';
    return `[${value}](${style}) `;
  }

  if (moduleName === 'git_branch') {
    const symbol = moduleConfig?.symbol || '🌱 ';
    const style = moduleConfig?.style || 'purple bold';
    return `[${symbol}${value}](${style}) `;
  }

  if (moduleName === 'git_status') {
    const gitStatusConfig = moduleConfig as GitStatusConfig;
    const statusSymbols = [
      gitStatusConfig.conflicted || '🏳', // Conflicted
      gitStatusConfig.ahead || '🏎💨', // Ahead
      gitStatusConfig.behind || '😰', // Behind
      gitStatusConfig.diverged || '😵', // Diverged
      gitStatusConfig.untracked || '🤷', // Untracked
      gitStatusConfig.stashed || '📦', // Stashed
      gitStatusConfig.modified || '📝', // Modified
      gitStatusConfig.staged || '[++()](green)', // Staged
      gitStatusConfig.renamed || '👅', // Renamed
      gitStatusConfig.deleted || '🗑', // Deleted
    ];

    // Combine symbols based on mock scenario status (simplified)
    const activeStatusSymbols = statusSymbols.filter((s) => value.includes(s));
    const displayValue = activeStatusSymbols.join(' ');
    const style = gitStatusConfig.style || 'white';
    const format = gitStatusConfig.format || '($displayValue) ';

    const output = format
      .replace('$displayValue', displayValue)
      .replace('$style', style);

    return output;
  }

  if (moduleName === 'character') {
    // Determine style based on error state from scenario
    const isError = scenario.name.toLowerCase().includes('error');

    // Get style from config if possible
    let style = 'bold green';
    const charConfig = moduleConfig as unknown as CharacterConfig;
    const successSymbol = charConfig?.success_symbol || '[❯](bold green)';
    const errorSymbol = charConfig?.error_symbol || '[❯](bold red)';
    const symbolConfig = isError ? errorSymbol : successSymbol;

    // Try to extract style from config format string like [x](y)
    if (symbolConfig && symbolConfig.includes('](')) {
      const match = symbolConfig.match(/\]\((.*?)\)/);
      if (match) style = match[1];
    }

    // Use the value from mock data (e.g. ❯) with the style
    return `[${value}](${style}) `;
  }

  // Generic fallback for other modules
  const style = moduleConfig?.style || 'white';
  const symbol = moduleConfig?.symbol || '';
  // Note: We use a simplified default format here for the MVP
  const format = moduleConfig?.format || 'via [$symbol$version]($style) ';

  const output = format
    .replace('$symbol', symbol)
    .replace('$version', value)
    .replace('$style', style);

  return output;
}

/**
 * Converts a Starship style string to ANSI escape codes
 * @param style - The style string (e.g. "bold red", "bg:blue fg:white")
 * @param _config - (Optional) The Starship configuration
 * @returns ANSI escape code string
 */

export function styleToAnsi(style: string, _config?: StarshipConfig): string {
  if (!style) return '';

  const parts = style.split(/\s+/);
  const codes: number[] = [];
  let fgCode: number | null = null;
  let bgCode: number | null = null;

  parts.forEach((part) => {
    // Modifiers
    if (part === 'bold') codes.push(1);
    else if (part === 'dimmed') codes.push(2);
    else if (part === 'italic') codes.push(3);
    else if (part === 'underline') codes.push(4);
    else if (part === 'inverted') codes.push(7);
    else if (part === 'hidden') codes.push(8);
    else if (part === 'strikethrough') codes.push(9);
    // Background color
    else if (part.startsWith('bg:')) {
      const color = part.substring(3);
      const code = getColorCode(color, true);
      if (code !== null) bgCode = code;
    }
    // Foreground color (default if not recognized as modifier or bg)
    else {
      // Check for fg: prefix explicitly just in case, though starship usually omits it for fg
      const color = part.startsWith('fg:') ? part.substring(3) : part;
      const code = getColorCode(color, false);
      if (code !== null) fgCode = code;
    }
  });

  if (fgCode !== null) codes.push(fgCode);
  if (bgCode !== null) codes.push(bgCode);

  if (codes.length === 0) return '';
  return `\x1b[${codes.join(';')}m`;
}

/**
 * Helper to get ANSI color code from color name or hex
 */
function getColorCode(color: string, isBackground: boolean): number | null {
  const base = isBackground ? 40 : 30;
  const brightBase = isBackground ? 100 : 90;

  const colors = [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'purple',
    'cyan',
    'white',
  ];

  // Standard colors
  const index = colors.indexOf(color);
  if (index !== -1) return base + index;

  // Bright colors
  if (color.startsWith('bright-')) {
    const brightColor = color.substring(7);
    const brightIndex = colors.indexOf(brightColor);
    if (brightIndex !== -1) return brightBase + brightIndex;
  }

  // Hex colors (approximate mapping or truecolor if supported)
  // For simplicity in this environment, we'll map to closest standard color or ignore
  // In a real terminal emulator like xterm.js, we can use truecolor: \x1b[38;2;R;G;Bm
  if (color.startsWith('#')) {
    // Parse hex
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);

    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      // simple 256 color mapping logic is complex, let's use truecolor ANSI sequence
      // Foreground: 38;2;R;G;B
      // Background: 48;2;R;G;B
      // However, to keep return type simple (number), we can't easily return the full sequence.
      // Wait, the caller expects codes array.
      // Let's change logic slightly to return string or handle it differently?
      // No, I'll stick to basic colors for now to avoid complexity,
      // OR I can return a special large number and handle it, but simpler is better for "black screen" fix.

      // Actually, let's just return a default color if hex is provided to avoid crash
      // Or even better, try to find the closest ANSI color.
      // For now, let's just return null for hex to avoid breaking the escape sequence structure
      // if we don't support it fully.
      return null;
    }
  }

  // Numerical ANSI colors
  const num = parseInt(color, 10);
  if (!isNaN(num) && num >= 0 && num <= 255) {
    // 38;5;n for fg, 48;5;n for bg
    // But we can't return this as a single number easily in the current structure.
    return null;
  }

  return null;
}
