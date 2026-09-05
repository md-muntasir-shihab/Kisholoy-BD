import { useCallback, useRef, useState } from 'react';

/**
 * Tracks which async admin action is in flight.
 *
 * Most admin handlers POST and then refetch, but nothing stopped a second
 * submit while the first was still running. That is how duplicate expenses,
 * double dispatches and repeated status flips happen (F-306 — and the delivery
 * mechanism for F-304).
 *
 * Usage:
 *   const { run, isPending, isBusy } = usePendingAction();
 *   <button disabled={isBusy} onClick={() => run('save', async () => { ... })}>
 *     {isPending('save') ? 'Saving…' : 'Save'}
 *   </button>
 *
 * `run` is a no-op while the same key is already running, so a double-click
 * cannot fire the request twice even before React re-renders the disabled
 * state — the ref guard closes that window.
 */
export function usePendingAction() {
  const [pending, setPending] = useState<string | null>(null);
  const inFlight = useRef<Set<string>>(new Set());

  const run = useCallback(
    async <T,>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
      // Ref check, not state: state updates are async, so two clicks in the
      // same tick would both see `pending === null`.
      if (inFlight.current.has(key)) return undefined;
      inFlight.current.add(key);
      setPending(key);
      try {
        return await action();
      } finally {
        inFlight.current.delete(key);
        setPending(prev => (prev === key ? null : prev));
      }
    },
    []
  );

  const isPending = useCallback((key: string) => pending === key, [pending]);

  return {
    /** Run `action` under `key`, ignoring re-entry while it is in flight. */
    run,
    /** True when this specific key is running. */
    isPending,
    /** True when any action is running (use to disable a whole toolbar). */
    isBusy: pending !== null,
    /** The key currently running, or null. */
    pending,
  };
}
