import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '../../contexts/ToastContext';
import { ImagePalette } from '../ImagePalette';

interface MockMessageEvent {
  data: {
    type: string;
    payload?: {
      primary: string;
    };
  };
}

// Mock Worker
class MockWorker {
  url: string | URL;
  onmessage: ((ev: MockMessageEvent) => void) | null = null;
  onerror: ((ev: ErrorEvent) => void) | null = null;

  constructor(url: string | URL) {
    this.url = url;
  }

  postMessage() {
    if (this.onmessage) {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({
            data: { type: 'success', payload: { primary: '#fff' } },
          } as MockMessageEvent);
        }
      }, 10);
    }
  }

  terminate() {}
}

(globalThis as unknown as { Worker: typeof MockWorker }).Worker = MockWorker;

describe('ImagePalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <ImagePalette />
      </ToastProvider>,
    );

  it('renders input field and button', () => {
    renderComponent();
    expect(
      screen.getByPlaceholderText('https://example.com/wallpaper.jpg'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /extract/i }),
    ).toBeInTheDocument();
  });

  it('handles user input and executes extraction process', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText(
      'https://example.com/wallpaper.jpg',
    );
    const user = userEvent.setup();

    await user.type(input, 'https://test.com/image.png');
    const button = screen.getByRole('button', { name: /extract/i });
    await user.click(button);

    // Initial click should change text to Extracting
    expect(
      screen.getByRole('button', { name: /extracting/i }),
    ).toBeInTheDocument();

    // After worker resolves
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /extract & apply palette/i }),
      ).toBeInTheDocument();
    });
  });
});
