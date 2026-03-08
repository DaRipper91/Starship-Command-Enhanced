import { bench, describe } from 'vitest';

const mockTheme = {
  metadata: {
    id: 'test-id',
    name: 'Test Theme',
    created: new Date(),
    updated: new Date(),
  },
  config: {
    format: '$directory$character',
    directory: { style: 'blue', truncation_length: 3 },
    character: { success_symbol: '[❯](green)' },
    palettes: {
      global: {
        primary: '#ff0000',
      },
    },
  },
};

const jsonClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const customClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  if (Array.isArray(obj)) {
    const arrCopy = [] as unknown[];
    for (let i = 0; i < obj.length; i++) {
      arrCopy[i] = customClone(obj[i]);
    }
    return arrCopy as unknown as T;
  }
  const objCopy = {} as Record<string, unknown>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      objCopy[key] = customClone((obj as Record<string, unknown>)[key]);
    }
  }
  return objCopy as unknown as T;
};

const structuredCloneFallback = <T>(obj: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
};

describe('Deep Clone Benchmarks', () => {
  bench('JSON.parse(JSON.stringify())', () => {
    jsonClone(mockTheme);
  });

  bench('custom recursive clone', () => {
    customClone(mockTheme);
  });

  bench('structuredClone (if available)', () => {
    structuredCloneFallback(mockTheme);
  });
});
