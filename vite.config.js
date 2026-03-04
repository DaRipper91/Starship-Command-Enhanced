/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
  define: {
    // Polyfill global for dependencies like xterm.js without exposing window.global
    global: 'globalThis',
  },
  // @ts-expect-error - Vitest types are not automatically merged into Vite config in this setup
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
  build: {
    rollupOptions: {
      treeshake: true,
      output: {
        manualChunks: {
          'vendor-core': [
            'react',
            'react-dom',
            'zustand',
            'clsx',
            'tailwind-merge',
          ],
          'vendor-ui': [
            'lucide-react',
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
          ],
          'vendor-utils': [
            'colord',
            'colorthief',
            'node-vibrant',
            'html2canvas',
            '@iarna/toml',
          ],
          'vendor-terminal': ['xterm', 'xterm-addon-fit'],
        },
      },
    },
    chunkSizeWarningLimit: 400,
    reportCompressedSize: true,
  },
});
