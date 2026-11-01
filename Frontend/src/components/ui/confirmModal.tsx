import type { ReactNode } from "react";
import { Modal } from "./model";

interface ConfirmModalProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending?: boolean;
  error?: string | null;
  // Shown instead of Cancel, e.g. "Record a sale instead"
  secondaryAction?: { label: string; onClick: () => void };
}

// "Are you sure?" window with a red confirm button
export function ConfirmModal({
  title,
  children,
  confirmLabel,
  onConfirm,
  onClose,
  isPending,
  error,
  secondaryAction,
}: ConfirmModalProps) {
  return (
    <Modal isOpen onClose={onClose} title={title}>
      <div className="space-y-3 text-sm text-gray-600">{children}</div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={secondaryAction?.onClick ?? onClose}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-accent-secondary hover:text-text"
        >
          {secondaryAction?.label ?? "Cancel"}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90 disabled:opacity-60"
        >
          {isPending ? "Removing..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
