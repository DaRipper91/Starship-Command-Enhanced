import { describe, expect, it } from 'vitest';

import { TomlParser } from './toml-parser';

describe('TomlParser', () => {
  describe('merge', () => {
    it('should merge two simple objects', () => {
      const base = { a: 1 };
      const override = { b: 2 };
      const result = TomlParser.merge(base, override);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should overwrite primitive values', () => {
      const base = { a: 1 };
      const override = { a: 2 };
      const result = TomlParser.merge(base, override);
      expect(result).toEqual({ a: 2 });
    });

    it('should recursively merge nested objects', () => {
      const base = {
        nested: {
          a: 1,
          b: 2,
        },
      };
      const override = {
        nested: {
          b: 3,
          c: 4,
        },
      };
      const result = TomlParser.merge(base, override);
      expect(result).toEqual({
        nested: {
          a: 1,
          b: 3,
          c: 4,
        },
      });
    });

    it('should handle deep nested merging', () => {
      const base = {
        level1: {
          level2: {
            a: 1,
          },
        },
      };
      const override = {
        level1: {
          level2: {
            b: 2,
          },
        },
      };
      const result = TomlParser.merge(base, override);
      expect(result).toEqual({
        level1: {
          level2: {
            a: 1,
            b: 2,
          },
        },
      });
    });

    it('should overwrite arrays instead of merging them', () => {
      const base = { arr: [1, 2] };
      const override = { arr: [3, 4] };
      const result = TomlParser.merge(base, override);
      expect(result).toEqual({ arr: [3, 4] });
    });

    it('should handle null values correctly', () => {
      const base = { a: 1 };
      const override = { a: null };
      const result = TomlParser.merge(base, override);
      expect(result).toEqual({ a: null });
    });

    it('should handle undefined override', () => {
      const base = { a: 1 };
      const result = TomlParser.merge(base, undefined);
      expect(result).toEqual(base);
    });

    it('should handle undefined base', () => {
      const override = { a: 1 };
      const result = TomlParser.merge(undefined, override);
      expect(result).toEqual(override);
    });

    it('should not mutate the input objects', () => {
      const base = { nested: { a: 1 } };
      const override = { nested: { b: 2 } };
      TomlParser.merge(base, override);
      expect(base).toEqual({ nested: { a: 1 } });
      expect(override).toEqual({ nested: { b: 2 } });
    });

    it('should handle empty objects', () => {
      const base = {};
      const override = {};
      const result = TomlParser.merge(base, override);
      expect(result).toEqual({});
    });

    it('should overwrite object with primitive', () => {
      const base = { a: { b: 1 } };
      const override = { a: 2 };
      const result = TomlParser.merge(base, override);
      expect(result).toEqual({ a: 2 });
    });

    it('should overwrite primitive with object', () => {
      const base = { a: 1 };
      const override = { a: { b: 2 } };
      const result = TomlParser.merge(base, override);
      expect(result).toEqual({ a: { b: 2 } });
    });

    it('should merge two objects', () => {
      const base = { a: 1, b: { c: 2 } };
      const override = { b: { d: 3 }, e: 4 };
      const expected = { a: 1, b: { c: 2, d: 3 }, e: 4 };
      expect(TomlParser.merge(base, override)).toEqual(expected);
    });

    it('should NOT allow prototype pollution via __proto__', () => {
      const base: Record<string, unknown> = {};
      const override = JSON.parse('{"__proto__": {"polluted": "yes"}}');

      const result = TomlParser.merge(base, override);

      expect(result?.['polluted']).toBeUndefined();
      expect(
        (Object.prototype as unknown as Record<string, unknown>).polluted,
      ).toBeUndefined();
    });

    it('should NOT allow prototype pollution via constructor', () => {
      const base: Record<string, unknown> = {};
      const override = JSON.parse(
        '{"constructor": {"prototype": {"polluted": "yes"}}}',
      );

      const result = TomlParser.merge(base, override);

      expect(result?.['polluted']).toBeUndefined();
      expect(
        (Object.prototype as unknown as Record<string, unknown>).polluted,
      ).toBeUndefined();
    });

    it('should NOT allow prototype pollution via prototype', () => {
      const base: Record<string, unknown> = {};
      const override = JSON.parse('{"prototype": {"polluted": "yes"}}');

      const result = TomlParser.merge(base, override);

      expect(result?.['polluted']).toBeUndefined();
      expect(
        (Object.prototype as unknown as Record<string, unknown>).polluted,
      ).toBeUndefined();
    });
  });
});
