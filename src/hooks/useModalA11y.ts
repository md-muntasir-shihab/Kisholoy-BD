import { useEffect, useRef } from 'react';

/**
 * Keyboard and screen-reader behaviour for a modal dialog.
 *
 * No admin modal implemented Escape, a focus trap, focus restore or the ARIA
 * dialog roles (F-307), so keyboard and screen-reader operators could not close
 * or navigate any of them, and focus stayed behind the overlay.
 *
 * Attach the returned ref to the dialog container and spread `dialogProps` on
 * it. Behaviour provided:
 *   - Escape closes (unless `closeOnEscape` is false — use for destructive
 *     confirmations you do not want dismissed by accident).
 *   - Tab / Shift+Tab cycle within the dialog.
 *   - Focus moves to the dialog on open and returns to the trigger on close.
 *   - Background scroll is locked while open.
 */
export interface UseModalA11yOptions {
  open: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  /** Accessible name; pass the same text as the visible heading. */
  label?: string;
  /** Id of the element that labels the dialog (preferred over `label`). */
  labelledBy?: string;
}

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useModalA11y({
  open,
  onClose,
  closeOnEscape = true,
  label,
  labelledBy,
}: UseModalA11yOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const node = containerRef.current;
    if (node) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      // Focus the first control, else the dialog itself so screen readers
      // announce it and Escape reaches our handler.
      (first ?? node).focus({ preventScroll: true });
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const el = containerRef.current;
      if (!el) return;
      const items: HTMLElement[] = Array.from(
        el.querySelectorAll(FOCUSABLE) as NodeListOf<HTMLElement>
      ).filter(i => i.offsetParent !== null || i === document.activeElement);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (active === first || !el.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, closeOnEscape]);

  return {
    containerRef,
    /** Spread onto the dialog container element. */
    dialogProps: {
      role: 'dialog' as const,
      'aria-modal': true,
      ...(labelledBy ? { 'aria-labelledby': labelledBy } : { 'aria-label': label }),
      tabIndex: -1,
    },
  };
}
