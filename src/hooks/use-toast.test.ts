import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { reducer } from './use-toast';

// ---------------------------------------------------------------------------
// Tests for the exported `reducer` function
// The reducer is the pure, synchronous heart of the toast state machine and
// can be exercised without any React rendering.
// ---------------------------------------------------------------------------

describe('toast reducer', () => {
  const baseState = { toasts: [] };

  const makeToast = (overrides = {}) => ({
    id: '1',
    open: true,
    title: 'Test toast',
    description: 'A description',
    ...overrides,
  });

  // -------------------------------------------------------------------------
  // ADD_TOAST
  // -------------------------------------------------------------------------
  describe('ADD_TOAST', () => {
    it('adds a toast to an empty list', () => {
      const toast = makeToast();
      const nextState = reducer(baseState, { type: 'ADD_TOAST', toast });
      expect(nextState.toasts).toHaveLength(1);
      expect(nextState.toasts[0]).toEqual(toast);
    });

    it('replaces the existing toast with the newest one (TOAST_LIMIT = 1)', () => {
      const first = makeToast({ id: '1', title: 'First' });
      const stateWithFirst = reducer(baseState, { type: 'ADD_TOAST', toast: first });

      const second = makeToast({ id: '2', title: 'Second' });
      const stateWithBoth = reducer(stateWithFirst, { type: 'ADD_TOAST', toast: second });

      // TOAST_LIMIT is 1: only the newest toast is retained
      expect(stateWithBoth.toasts).toHaveLength(1);
      expect(stateWithBoth.toasts[0].id).toBe('2');
    });

    it('enforces the TOAST_LIMIT of 1 (only keeps the most recent toast)', () => {
      const first = makeToast({ id: '1', title: 'First' });
      const stateWithFirst = reducer(baseState, { type: 'ADD_TOAST', toast: first });

      const second = makeToast({ id: '2', title: 'Second' });
      const finalState = reducer(stateWithFirst, { type: 'ADD_TOAST', toast: second });

      // TOAST_LIMIT is 1, so only the newest toast should survive
      expect(finalState.toasts).toHaveLength(1);
      expect(finalState.toasts[0].id).toBe('2');
    });

    it('does not mutate the original state', () => {
      const toast = makeToast();
      const original = { toasts: [] };
      reducer(original, { type: 'ADD_TOAST', toast });
      expect(original.toasts).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // UPDATE_TOAST
  // -------------------------------------------------------------------------
  describe('UPDATE_TOAST', () => {
    it('updates an existing toast by id', () => {
      const toast = makeToast({ id: '42', title: 'Original title' });
      const stateWithToast = reducer(baseState, { type: 'ADD_TOAST', toast });

      const updatedState = reducer(stateWithToast, {
        type: 'UPDATE_TOAST',
        toast: { id: '42', title: 'Updated title' },
      });

      expect(updatedState.toasts[0].title).toBe('Updated title');
    });

    it('preserves properties that are not being updated', () => {
      const toast = makeToast({ id: '42', title: 'Title', description: 'Desc' });
      const stateWithToast = reducer(baseState, { type: 'ADD_TOAST', toast });

      const updatedState = reducer(stateWithToast, {
        type: 'UPDATE_TOAST',
        toast: { id: '42', title: 'New title' },
      });

      expect(updatedState.toasts[0].description).toBe('Desc');
    });

    it('leaves unrelated toasts unchanged', () => {
      // Only one toast is allowed by TOAST_LIMIT so this verifies the list
      // itself is returned correctly.
      const toast = makeToast({ id: '1', title: 'Original' });
      const stateWithToast = reducer(baseState, { type: 'ADD_TOAST', toast });

      const updatedState = reducer(stateWithToast, {
        type: 'UPDATE_TOAST',
        toast: { id: '999', title: 'Should not match' },
      });

      expect(updatedState.toasts[0].title).toBe('Original');
    });
  });

  // -------------------------------------------------------------------------
  // DISMISS_TOAST
  // -------------------------------------------------------------------------
  describe('DISMISS_TOAST', () => {
    it('sets open:false on the targeted toast', () => {
      const toast = makeToast({ id: '7', open: true });
      const stateWithToast = reducer(baseState, { type: 'ADD_TOAST', toast });

      const dismissedState = reducer(stateWithToast, {
        type: 'DISMISS_TOAST',
        toastId: '7',
      });

      expect(dismissedState.toasts[0].open).toBe(false);
    });

    it('sets open:false on ALL toasts when toastId is undefined', () => {
      const toast1 = makeToast({ id: '1', open: true });
      const stateWithOne = reducer(baseState, { type: 'ADD_TOAST', toast: toast1 });

      const dismissedState = reducer(stateWithOne, { type: 'DISMISS_TOAST' });

      dismissedState.toasts.forEach((t) => {
        expect(t.open).toBe(false);
      });
    });

    it('does not remove the toast from the list (only marks it closed)', () => {
      const toast = makeToast({ id: '5' });
      const stateWithToast = reducer(baseState, { type: 'ADD_TOAST', toast });

      const dismissedState = reducer(stateWithToast, {
        type: 'DISMISS_TOAST',
        toastId: '5',
      });

      expect(dismissedState.toasts).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // REMOVE_TOAST
  // -------------------------------------------------------------------------
  describe('REMOVE_TOAST', () => {
    it('removes the toast with the matching id', () => {
      const toast = makeToast({ id: '3' });
      const stateWithToast = reducer(baseState, { type: 'ADD_TOAST', toast });

      const removedState = reducer(stateWithToast, {
        type: 'REMOVE_TOAST',
        toastId: '3',
      });

      expect(removedState.toasts).toHaveLength(0);
    });

    it('removes ALL toasts when toastId is undefined', () => {
      const toast = makeToast({ id: '1' });
      const stateWithToast = reducer(baseState, { type: 'ADD_TOAST', toast });

      const clearedState = reducer(stateWithToast, { type: 'REMOVE_TOAST' });

      expect(clearedState.toasts).toHaveLength(0);
    });

    it('leaves unrelated toasts intact when removing by id (even though limit is 1)', () => {
      const toast = makeToast({ id: '1' });
      const stateWithToast = reducer(baseState, { type: 'ADD_TOAST', toast });

      // Attempt to remove a non-existent id
      const resultState = reducer(stateWithToast, {
        type: 'REMOVE_TOAST',
        toastId: '999',
      });

      expect(resultState.toasts).toHaveLength(1);
      expect(resultState.toasts[0].id).toBe('1');
    });
  });
});

// ---------------------------------------------------------------------------
// Tests for the `toast` function and `useToast` hook via renderHook
// ---------------------------------------------------------------------------
import { renderHook, act } from '@testing-library/react';
import { useToast, toast } from './use-toast';

describe('useToast hook', () => {
  // Reset module-level shared state between tests by dismissing all toasts
  beforeEach(() => {
    // Dismiss any leftover toasts from previous tests
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss();
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('returns a toasts array, a toast function, and a dismiss function', () => {
    const { result } = renderHook(() => useToast());
    expect(Array.isArray(result.current.toasts)).toBe(true);
    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('adds a toast when toast() is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Hello', description: 'World' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Hello');
    expect(result.current.toasts[0].description).toBe('World');
  });

  it('new toast replaces old one due to TOAST_LIMIT of 1', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'First' });
    });

    act(() => {
      toast({ title: 'Second' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Second');
  });

  it('newly added toast has open:true by default', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Open toast' });
    });

    expect(result.current.toasts[0].open).toBe(true);
  });

  it('dismiss() with a specific id sets the toast open:false', () => {
    const { result } = renderHook(() => useToast());
    let toastId: string;

    act(() => {
      const t = toast({ title: 'Dismissible' });
      toastId = t.id;
    });

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it('dismiss() with no argument dismisses all toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Toast A' });
    });

    act(() => {
      result.current.dismiss();
    });

    result.current.toasts.forEach((t) => {
      expect(t.open).toBe(false);
    });
  });

  it('toast() returns an object with id, dismiss, and update functions', () => {
    const { result } = renderHook(() => useToast());
    let toastReturn: ReturnType<typeof toast>;

    act(() => {
      toastReturn = toast({ title: 'Check return' });
    });

    expect(typeof toastReturn!.id).toBe('string');
    expect(typeof toastReturn!.dismiss).toBe('function');
    expect(typeof toastReturn!.update).toBe('function');
  });

  it('the update function returned by toast() can update the toast', () => {
    const { result } = renderHook(() => useToast());
    let toastReturn: ReturnType<typeof toast>;

    act(() => {
      toastReturn = toast({ title: 'Original' });
    });

    act(() => {
      toastReturn.update({
        id: toastReturn.id,
        title: 'Updated via update()',
      });
    });

    expect(result.current.toasts[0].title).toBe('Updated via update()');
  });

  it('toast supports a variant property (destructive)', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Error', variant: 'destructive' });
    });

    expect(result.current.toasts[0].variant).toBe('destructive');
  });

  it('calling dismiss via the returned object closes that specific toast', () => {
    const { result } = renderHook(() => useToast());
    let toastReturn: ReturnType<typeof toast>;

    act(() => {
      toastReturn = toast({ title: 'Closeable' });
    });

    act(() => {
      toastReturn.dismiss();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it('onOpenChange callback dismisses the toast when called with false', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'With callback' });
    });

    const { onOpenChange } = result.current.toasts[0];

    act(() => {
      onOpenChange?.(false);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });
});
