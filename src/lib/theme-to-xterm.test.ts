import { describe, expect, it } from 'vitest';

import { StarshipConfig } from '../types/starship.types';
import { translateThemeToXterm } from './theme-to-xterm';

describe('translateThemeToXterm', () => {
  it('should return default colors when config is empty', () => {
    const config: StarshipConfig = {};
    const theme = translateThemeToXterm(config);

    expect(theme.background).toBe('#1e1e1e');
    expect(theme.foreground).toBe('#ffffff');
    expect(theme.black).toBe('#2e3440');
    expect(theme.red).toBe('#bf616a');
    expect(theme.green).toBe('#a3be8c');
    expect(theme.yellow).toBe('#ebcb8b');
    expect(theme.blue).toBe('#81a1c1');
    expect(theme.magenta).toBe('#b48ead');
    expect(theme.cyan).toBe('#88c0d0');
    expect(theme.white).toBe('#e5e9f0');
  });

  it('should return default colors when specified palette is missing', () => {
    const config: StarshipConfig = {
      palette: 'missing',
    };
    const theme = translateThemeToXterm(config);

    expect(theme.background).toBe('#1e1e1e');
    expect(theme.foreground).toBe('#ffffff');
  });

  it('should use colors from the specified custom palette', () => {
    const config: StarshipConfig = {
      palette: 'custom',
      palettes: {
        custom: {
          bg: '#000000',
          fg: '#ffffff',
          color0: '#111111',
        },
      },
    };
    const theme = translateThemeToXterm(config);

    expect(theme.background).toBe('#000000');
    expect(theme.foreground).toBe('#ffffff');
    expect(theme.black).toBe('#111111');
  });

  it('should use colors from the global palette by default', () => {
    const config: StarshipConfig = {
      palettes: {
        global: {
          bg: '#222222',
          color1: '#ff0000',
        },
      },
    };
    const theme = translateThemeToXterm(config);

    expect(theme.background).toBe('#222222');
    expect(theme.red).toBe('#ff0000');
    expect(theme.foreground).toBe('#ffffff'); // Default
  });

  it('should fallback to #ffffff for invalid colors in palette', () => {
    const config: StarshipConfig = {
      palettes: {
        global: {
          bg: 'invalid-color',
        },
      },
    };
    const theme = translateThemeToXterm(config);

    // ColorUtils.resolveColor returns #ffffff as fallback for invalid colors
    expect(theme.background).toBe('#ffffff');
  });
});
