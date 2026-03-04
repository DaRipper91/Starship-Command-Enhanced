import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchJson } from './api';

describe('fetchJson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return data on successful JSON response', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse = {
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await fetchJson('/test-url');

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      '/test-url',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
    const callHeaders = (global.fetch as any).mock.calls[0][1].headers as Headers;
    expect(callHeaders.get('Content-Type')).toBe('application/json');
  });

  it('should merge custom headers', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await fetchJson('/test-url', {
      headers: { 'X-Custom-Header': 'value' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/test-url',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
    const callHeaders = (global.fetch as any).mock.calls[0][1].headers as Headers;
    expect(callHeaders.get('Content-Type')).toBe('application/json');
    expect(callHeaders.get('X-Custom-Header')).toBe('value');
  });

  it('should throw error with message from JSON on failure', async () => {
    const mockErrorData = { error: 'Server error message' };
    const mockResponse = {
      ok: false,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockErrorData,
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(fetchJson('/test-url')).rejects.toThrow('Server error message');
  });

  it('should throw default error message on failure without error in JSON', async () => {
    const mockResponse = {
      ok: false,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(fetchJson('/test-url', {}, 'Default error')).rejects.toThrow(
      'Default error'
    );
  });

  it('should throw default error message on failure with non-JSON response', async () => {
    const mockResponse = {
      ok: false,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'Error text',
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(fetchJson('/test-url', {}, 'Default error')).rejects.toThrow(
      'Default error'
    );
  });

  it('should throw error if JSON parsing fails on a response that claims to be JSON', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => {
        throw new Error('JSON Parse Error');
      },
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    await expect(fetchJson('/test-url')).rejects.toThrow('JSON Parse Error');
  });
});
