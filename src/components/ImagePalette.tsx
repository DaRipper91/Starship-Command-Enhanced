import { Image as ImageIcon, Link } from 'lucide-react';
import { useState } from 'react';

import { useToast } from '../contexts/ToastContext';
import { useThemeStore } from '../stores/theme-store';

export function ImagePalette() {
  const { updateConfig } = useThemeStore();
  const { addToast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtract = async () => {
    if (!imageUrl) {
      addToast('Please enter an image URL.', 'info');
      return;
    }

    setIsExtracting(true);
    try {
      const worker = new Worker(
        new URL('../workers/color-extraction.worker.ts', import.meta.url),
        { type: 'module' },
      );

      worker.onmessage = (e) => {
        if (e.data.type === 'success') {
          updateConfig({
            palette: 'extracted',
            palettes: { extracted: e.data.payload },
          });
          addToast('Palette extracted and applied!', 'success');
        } else if (e.data.type === 'error') {
          addToast(e.data.error || 'Failed to extract palette.', 'error');
        }
        setIsExtracting(false);
        worker.terminate();
      };

      worker.onerror = (e) => {
        console.error('Worker error:', e);
        addToast('Worker failed to extract palette.', 'error');
        setIsExtracting(false);
        worker.terminate();
      };

      worker.postMessage({ imageUrl });
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'An unknown error occurred.',
        'error',
      );
      setIsExtracting(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 font-semibold text-gray-200">
        <ImageIcon size={16} /> Create Palette from Image
      </h3>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-400">
          Enter the URL of an image to automatically generate a new color
          palette and apply it to your theme.
        </p>
        <div className="flex items-center gap-2">
          <Link size={16} className="text-gray-500" />
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/wallpaper.jpg"
            className="flex-grow rounded-md border border-gray-600 bg-gray-900 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isExtracting}
          />
        </div>
      </div>

      <button
        onClick={handleExtract}
        disabled={isExtracting}
        className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
      >
        {isExtracting ? 'Extracting...' : 'Extract & Apply Palette'}
      </button>
    </div>
  );
}
