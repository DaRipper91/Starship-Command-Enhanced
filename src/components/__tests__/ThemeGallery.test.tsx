import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConfirmationProvider } from '../../contexts/ConfirmationContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { PRESET_THEMES } from '../../lib/presets';
import { ThemeGallery } from '../ThemeGallery';

describe('ThemeGallery', () => {
  it('renders preset themes correctly', () => {
    render(
      <ToastProvider>
        <ConfirmationProvider>
          <ThemeGallery />
        </ConfirmationProvider>
      </ToastProvider>,
    );

    expect(screen.getByText('Preset Themes')).toBeInTheDocument();

    // Check if at least one preset is rendered
    expect(
      screen.getByText(PRESET_THEMES[0].metadata.name),
    ).toBeInTheDocument();
  });
});
