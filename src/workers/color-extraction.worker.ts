import { Vibrant } from 'node-vibrant/browser';

self.onmessage = async (e) => {
  const { imageUrl } = e.data;

  try {
    const vibrant = new Vibrant(imageUrl);
    const palette = await vibrant.getPalette();

    if (!palette) {
      throw new Error('Failed to extract palette');
    }

    // Transform Vibrant palette to Starship palette structure
    const extractedPalette: Record<string, string> = {};
    if (palette.Vibrant) extractedPalette.primary = palette.Vibrant.hex;
    if (palette.Muted) extractedPalette.secondary = palette.Muted.hex;
    if (palette.LightVibrant)
      extractedPalette.accent = palette.LightVibrant.hex;
    if (palette.DarkVibrant)
      extractedPalette.background = palette.DarkVibrant.hex;
    if (palette.LightMuted)
      extractedPalette.foreground = palette.LightMuted.hex;

    // Fill missing fields with defaults or derived colors
    extractedPalette.success = extractedPalette.primary;
    extractedPalette.warning = extractedPalette.secondary;
    extractedPalette.error = extractedPalette.accent;

    self.postMessage({ type: 'success', payload: extractedPalette });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
