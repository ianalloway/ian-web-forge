import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

// The breakpoint used in the hook (matches the constant in the source file)
const MOBILE_BREAKPOINT = 768;

// Helper: create a fresh matchMedia mock that reports a given matches value
function createMatchMediaMock(matches: boolean) {
  const listeners: Array<() => void> = [];

  const mql = {
    matches,
    media: `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    onchange: null,
    addEventListener: vi.fn((event: string, cb: () => void) => {
      if (event === 'change') listeners.push(cb);
    }),
    removeEventListener: vi.fn((event: string, cb: () => void) => {
      if (event === 'change') {
        const idx = listeners.indexOf(cb);
        if (idx > -1) listeners.splice(idx, 1);
      }
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    _triggerChange: () => listeners.forEach((l) => l()),
  };

  return mql;
}

describe('useIsMobile hook', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Desktop (wide viewport)
  // -------------------------------------------------------------------------
  describe('when window.innerWidth is at or above the breakpoint (desktop)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: MOBILE_BREAKPOINT, // exactly at 768 => NOT mobile
      });
      const mock = createMatchMediaMock(false);
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue(mock),
      });
    });

    it('returns false for a viewport at the exact breakpoint width', () => {
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('returns false for a viewport wider than the breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Mobile (narrow viewport)
  // -------------------------------------------------------------------------
  describe('when window.innerWidth is below the breakpoint (mobile)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: MOBILE_BREAKPOINT - 1, // 767 => mobile
      });
      const mock = createMatchMediaMock(true);
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue(mock),
      });
    });

    it('returns true for a viewport below the breakpoint', () => {
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('returns true for very small viewport widths', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // matchMedia interaction
  // -------------------------------------------------------------------------
  describe('matchMedia query string', () => {
    it('calls window.matchMedia with the correct media query', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      const mockFn = vi.fn().mockReturnValue(createMatchMediaMock(false));
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: mockFn,
      });

      renderHook(() => useIsMobile());

      expect(mockFn).toHaveBeenCalledWith(
        `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
      );
    });
  });

  // -------------------------------------------------------------------------
  // Responsive resize via matchMedia change event
  // -------------------------------------------------------------------------
  describe('responds to viewport resize via matchMedia change event', () => {
    it('updates from false to true when viewport shrinks below breakpoint', () => {
      // Start as desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      const mock = createMatchMediaMock(false);
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue(mock),
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Simulate resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        });
        mock._triggerChange();
      });

      expect(result.current).toBe(true);
    });

    it('updates from true to false when viewport grows above breakpoint', () => {
      // Start as mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      const mock = createMatchMediaMock(true);
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue(mock),
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      // Simulate resize to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1200,
        });
        mock._triggerChange();
      });

      expect(result.current).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup: removeEventListener is called on unmount
  // -------------------------------------------------------------------------
  describe('cleanup on unmount', () => {
    it('removes the change event listener when the component unmounts', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      const mock = createMatchMediaMock(false);
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue(mock),
      });

      const { unmount } = renderHook(() => useIsMobile());

      expect(mock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      unmount();

      expect(mock.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  // -------------------------------------------------------------------------
  // Return type is always a boolean (not undefined)
  // -------------------------------------------------------------------------
  describe('return type', () => {
    it('always returns a boolean (never undefined)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue(createMatchMediaMock(false)),
      });

      const { result } = renderHook(() => useIsMobile());

      // The hook coerces the internal state with !! so it must be boolean
      expect(typeof result.current).toBe('boolean');
    });
  });
});
