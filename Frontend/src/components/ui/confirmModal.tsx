import type { ReactNode } from "react";
import { Modal } from "./model";
import { Button } from "./button";

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
        <Button variant="secondary" onClick={secondaryAction?.onClick ?? onClose}>
          {secondaryAction?.label ?? "Cancel"}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? "Removing..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
