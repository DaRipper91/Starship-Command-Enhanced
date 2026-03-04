import TOML from '@iarna/toml';

import MODULE_DEFINITIONS from '../generated/module-definitions.json';
import { StarshipConfig } from '../types/starship.types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Utility class for parsing and manipulating Starship TOML configurations
 */
export class TomlParser {
  /**
   * Parses a TOML string into a StarshipConfig object
   * @param tomlString - The TOML configuration string
   * @returns Parsed configuration object
   */
  static parse(tomlString: string): StarshipConfig {
    try {
      // @iarna/toml returns a Record<string, unknown>, which maps to our StarshipConfig
      const parsed = TOML.parse(tomlString);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Parsed TOML result is not an object');
      }
      return parsed as unknown as StarshipConfig;
    } catch (error) {
      console.error('Failed to parse TOML:', error);
      throw new Error(
        `Invalid TOML syntax: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Converts a StarshipConfig object back to a TOML string
   * @param config - The configuration object
   * @returns TOML string
   */
  static stringify(config: StarshipConfig): string {
    try {
      // Create a clean object without undefined values before stringifying
      // as some TOML stringifiers might struggle with undefined
      const cleanConfig = JSON.parse(JSON.stringify(config)) as TOML.JsonMap;
      return TOML.stringify(cleanConfig);
    } catch (error) {
      console.error('Failed to stringify config:', error);
      throw new Error('Failed to generate TOML');
    }
  }

  /**
   * Returns a default configuration with sensible defaults
   * @returns Default StarshipConfig
   */
  static getDefaultConfig(): StarshipConfig {
    return {
      // Common defaults
      add_newline: true,
      // Minimal format to start with
      format:
        '$username$hostname$directory$git_branch$git_state$git_status$cmd_duration$line_break$character',

      character: {
        success_symbol: '[➜](bold green)',
        error_symbol: '[➜](bold red)',
      },

      directory: {
        truncation_length: 3,
        truncate_to_repo: false,
      },

      git_branch: {
        symbol: '🌱 ',
        format: '[$symbol$branch]($style) ',
        truncation_length: 24,
      },

      git_status: {
        format: '([$all_status$ahead_behind]($style) )',
        conflicted: '🏳',
        ahead: '🏎💨',
        behind: '😰',
        diverged: '😵',
        up_to_date: '✓',
        untracked: '🤷',
        stashed: '📦',
        modified: '📝',
        staged: '[++()](green)',
        renamed: '👅',
        deleted: '🗑',
      },

      nodejs: {
        format: 'via [⬢ $version](bold green) ',
      },
    };
  }

  /**
   * Validates a Starship configuration object
   * @param config - Configuration to validate
   * @returns Validation result
   */
  static validate(config: StarshipConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for invalid types or required fields
    if (typeof config !== 'object' || config === null) {
      return {
        valid: false,
        errors: ['Configuration must be an object'],
        warnings: [],
      };
    }

    // Known top-level string/number/boolean properties
    const knownProps = [
      'format',
      'right_format',
      'continuation_prompt',
      'add_newline',
      'scan_timeout',
      'command_timeout',
      'palette',
      'palettes',
      'custom',
    ];

    // Validate top-level properties types
    if (config.format !== undefined && typeof config.format !== 'string') {
      errors.push('Format must be a string');
    }
    if (
      config.add_newline !== undefined &&
      typeof config.add_newline !== 'boolean'
    ) {
      errors.push('add_newline must be a boolean');
    }
    if (
      config.scan_timeout !== undefined &&
      typeof config.scan_timeout !== 'number'
    ) {
      errors.push('scan_timeout must be a number');
    }
    if (
      config.command_timeout !== undefined &&
      typeof config.command_timeout !== 'number'
    ) {
      errors.push('command_timeout must be a number');
    }
    if (config.palette !== undefined && typeof config.palette !== 'string') {
      errors.push('palette must be a string');
    }
    if (
      config.palettes !== undefined &&
      (typeof config.palettes !== 'object' || Array.isArray(config.palettes))
    ) {
      errors.push('palettes must be a table');
    }
    if (
      config.custom !== undefined &&
      (typeof config.custom !== 'object' || Array.isArray(config.custom))
    ) {
      errors.push('custom must be a table');
    }

    // Check for unknown modules or properties
    const knownModuleIds = new Set(MODULE_DEFINITIONS.map((m) => m.name));

    Object.keys(config).forEach((key) => {
      // Skip known top-level props
      if (knownProps.includes(key)) return;

      // Check if it's a known module
      if (knownModuleIds.has(key)) {
        // It's a known module, check if it's an object (or disabled boolean which is rare but technically TOML handles)
        // Usually modules are tables.
        const val = config[key];
        if (typeof val !== 'object' && val !== undefined) {
          // Some modules might be effectively disabled if set to false? No, Starship usually expects a table.
          // But strict type check:
          errors.push(`Module '${key}' must be a table (object)`);
        } else if (val && typeof val === 'object' && !Array.isArray(val)) {
          // Check common module props
          const modConfig = val as Record<string, unknown>;
          if (
            modConfig.disabled !== undefined &&
            typeof modConfig.disabled !== 'boolean'
          ) {
            errors.push(`Module '${key}': 'disabled' must be a boolean`);
          }
        }
      } else {
        // Unknown key - effectively an unknown module
        warnings.push(
          `Unknown module or setting: '${key}'. It may be supported by Starship but not yet by this editor.`,
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Merges two configurations
   * @param base - Base configuration
   * @param override - Override configuration
   * @returns Merged configuration
   */
  static merge(
    base: Record<string, unknown> | undefined,
    override: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined {
    if (!override) return base;
    if (!base) return override;

    const result: Record<string, unknown> = { ...base };

    Object.keys(override).forEach((key) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return;
      }

      if (
        typeof override[key] === 'object' &&
        override[key] !== null &&
        !Array.isArray(override[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        // Recursive merge for objects
        result[key] = TomlParser.merge(
          result[key] as Record<string, unknown>,
          override[key] as Record<string, unknown>,
        );
      } else {
        // Direct overwrite for primitives or arrays
        result[key] = override[key];
      }
    });

    return result;
  }
}
