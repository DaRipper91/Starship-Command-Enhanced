import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ColorUtils } from './color-utils';

// Mock the worker
vi.mock('../workers/color-extraction.worker?worker', () => ({
  default: class MockWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    postMessage() {
      // Simulate async processing
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({
            data: {
              result: {
                primary: '#ff0000',
                secondary: '#00ff00',
                accent: '#0000ff',
                extracted16: Array(16).fill('#888888'),
              },
            },
          } as MessageEvent);
        }
      }, 10);
    }
    terminate() {}
  },
}));

describe('ColorUtils Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock createImageBitmap
    (globalThis as Record<string, unknown>).createImageBitmap = vi
      .fn()
      .mockResolvedValue({
        close: vi.fn(),
      } as unknown as ImageBitmap);
  });

  it('should use Web Worker to extract palette', async () => {
    const file = new File([''], 'test.png', { type: 'image/png' });

    const palette = await ColorUtils.extractPaletteFromImage(file);

    expect(palette).toBeDefined();
    expect(palette.primary).toBe('#ff0000');
    expect(globalThis.createImageBitmap).toHaveBeenCalledWith(file);
  });
});
