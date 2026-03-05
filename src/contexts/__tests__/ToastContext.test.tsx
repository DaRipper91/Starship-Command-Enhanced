import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from '../ToastContext';
import React from 'react';

// Dummy component to test the context
function TestComponent() {
  const { addToast } = useToast();

  return (
    <div>
      <button onClick={() => addToast('Test Info Toast', 'info')}>Add Info</button>
      <button onClick={() => addToast('Test Success Toast', 'success')}>Add Success</button>
      <button onClick={() => addToast('Test Error Toast', 'error')}>Add Error</button>
      <button onClick={() => addToast('Default Toast')}>Add Default</button>
    </div>
  );
}

// Dummy component to test useToast outside of provider
function OutsideComponent() {
  useToast();
  return null;
}

// Error boundary to catch thrown errors in OutsideComponent gracefully
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // Suppress
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-message">{this.state.error?.message}</div>;
    }

    return this.props.children;
  }
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('throws an error if useToast is used outside of ToastProvider', () => {
    // Suppress console.error for this test to avoid noisy output from React error boundary
    const consoleSpy = vi.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <OutsideComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-message')).toHaveTextContent('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });

  it('adds and displays a toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Verify no toasts are present initially
    expect(screen.queryByText('Test Info Toast')).not.toBeInTheDocument();

    // Add a toast
    act(() => {
      fireEvent.click(screen.getByText('Add Info'));
    });

    // Verify toast is displayed
    expect(screen.getByText('Test Info Toast')).toBeInTheDocument();
  });

  it('adds toasts with different types', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Success'));
    });
    expect(screen.getByText('Test Success Toast')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Add Error'));
    });
    expect(screen.getByText('Test Error Toast')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText('Add Default'));
    });
    expect(screen.getByText('Default Toast')).toBeInTheDocument();
  });

  it('removes a toast when the close button is clicked', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Info'));
    });
    expect(screen.getByText('Test Info Toast')).toBeInTheDocument();

    // Find the close button (the aria-label is 'Close notification' in Toast.tsx)
    const closeButton = screen.getByRole('button', { name: 'Close notification' });
    act(() => {
      fireEvent.click(closeButton);
    });

    // Verify toast is removed
    expect(screen.queryByText('Test Info Toast')).not.toBeInTheDocument();
  });

  it('automatically removes toasts after 3000ms', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Add Info'));
    });
    expect(screen.getByText('Test Info Toast')).toBeInTheDocument();

    // Advance timers by 2999ms
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(screen.getByText('Test Info Toast')).toBeInTheDocument();

    // Advance timers by 1ms (total 3000ms)
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Verify toast is auto-removed
    expect(screen.queryByText('Test Info Toast')).not.toBeInTheDocument();
  });
});
