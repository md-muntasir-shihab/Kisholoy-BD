import React from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';

interface AdminModalShellProps {
  /** Whether the dialog is showing. Render is skipped when false. */
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  /** Escape/backdrop dismissal off for destructive confirmations. */
  closeOnEscape?: boolean;
  /** Clicking the backdrop closes by default. */
  closeOnBackdrop?: boolean;
  /** Classes for the full-screen overlay. */
  overlayClassName?: string;
  children: React.ReactNode;
}

const DEFAULT_OVERLAY =
  'fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4';

/**
 * Accessible overlay wrapper for the ~60 modals declared inline inside admin
 * screens (F-307).
 *
 * The standalone `*Modal.tsx` components take `useModalA11y` directly, but the
 * inline ones each have their own open-state variable and no component
 * boundary, so wrapping them is the low-risk way to give them Escape, a focus
 * trap, focus restore and the ARIA dialog roles without restructuring each
 * screen.
 *
 * Before:  {showModal && (<div className="fixed inset-0 ...">…</div>)}
 * After:   <AdminModalShell open={showModal} onClose={() => setShowModal(false)}
 *            label="Adjust stock">…</AdminModalShell>
 */
export function AdminModalShell({
  open,
  onClose,
  label,
  closeOnEscape = true,
  closeOnBackdrop = true,
  overlayClassName = DEFAULT_OVERLAY,
  children,
}: AdminModalShellProps) {
  const { containerRef, dialogProps } = useModalA11y({ open, onClose, closeOnEscape, label });

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      {...dialogProps}
      className={overlayClassName}
      onMouseDown={(e) => {
        // mousedown, not click: a drag that ends on the backdrop should not
        // dismiss a form the user was selecting text in.
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
