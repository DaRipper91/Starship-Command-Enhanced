import { bench, describe } from 'vitest';

import { Theme } from '../types/starship.types';

// The object we will be testing
const testTheme: Theme = {
  metadata: {
    id: 'test-123',
    name: 'Complex Benchmark Theme',
    created: new Date('2023-01-01T12:00:00Z'),
    updated: new Date('2023-01-02T12:00:00Z'),
  },
  config: {
    format: '$username$hostname$directory$git_branch$git_status$character',
    add_newline: true,
    character: {
      success_symbol: '[❯](bold green)',
      error_symbol: '[✗](bold red)',
      vimcmd_symbol: '[❮](bold green)',
    },
    directory: {
      truncation_length: 3,
      truncate_to_repo: true,
      read_only: ' 🔒',
    },
    git_branch: {
      symbol: '🌿 ',
      truncation_length: 20,
      ignore_branches: ['master', 'main'],
    },
    git_status: {
      conflicted: '🏳',
      ahead: '⇡${count}',
      behind: '⇣${count}',
      diverged: '⇕⇡${ahead_count}⇣${behind_count}',
      untracked: '🤷',
      stashed: '📦',
      modified: '📝',
      staged: '[++\\($count\\)](green)',
      renamed: '📛',
      deleted: '🗑',
    },
    kubernetes: {
      disabled: false,
      context_alias: 'k8s',
    },
    custom: {
      my_module: {
        command: 'echo test',
        when: 'true',
        format: '[$output]($style)',
        style: 'bold blue',
      },
      another_module: {
        command: 'date',
        when: 'true',
        format: '[$output]($style)',
        style: 'bold red',
      },
    },
    palettes: {
      global: {
        primary: '#ff0000',
        secondary: '#00ff00',
        accent: '#0000ff',
      },
    },
  },
};

// Original implementation
const oldDeepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// We will test structuredClone as well to have a reference point
const nativeStructuredClone = <T>(obj: T): T => {
  return structuredClone(obj);
};

// Future optimized fallback
const optimizedDeepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  if (Array.isArray(obj)) {
    const arrCopy = new Array(obj.length);
    for (let i = 0; i < obj.length; i++) {
      arrCopy[i] = optimizedDeepClone(obj[i]);
    }
    return arrCopy as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  // Plain objects
  const objCopy = {} as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      objCopy[key] = optimizedDeepClone((obj as any)[key]); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }
  return objCopy;
};

describe('ThemeStore deepClone performance', () => {
  bench('oldDeepClone (JSON.parse/stringify)', () => {
    oldDeepClone(testTheme);
  });

  bench('optimizedDeepClone (custom recursive)', () => {
    optimizedDeepClone(testTheme);
  });

  if (typeof structuredClone === 'function') {
    bench('native structuredClone', () => {
      nativeStructuredClone(testTheme);
    });
  }
});
