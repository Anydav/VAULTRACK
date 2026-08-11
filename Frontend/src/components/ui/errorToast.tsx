import { useEffect, useState } from "react";

type ToastType = "error" | "success" | "warning" | "info";
export type { ToastType };

type ToastProps = {
  message: string;
  type?: ToastType;
  duration?: number; // ms
  onDismiss?: () => void;
};

const typeStyles: Record<ToastType, { bg: string; text: string; bar: string }> = {
  error: { bg: "bg-danger-bg", text: "text-danger", bar: "bg-danger" },
  success: { bg: "bg-success-bg", text: "text-success", bar: "bg-success" },
  warning: { bg: "bg-highlight-bg", text: "text-primary", bar: "bg-accent-secondary" },
  info: { bg: "bg-highlight-bg", text: "text-primary", bar: "bg-accent-secondary" },
};

export function Toast({
  message,
  type = "error",
  duration = 30000,
  onDismiss,
}: ToastProps) {
  const [leaving, setLeaving] = useState(false);

  // Start the exit animation once `duration` has elapsed
  useEffect(() => {
    const dismissTimer = setTimeout(() => setLeaving(true), duration);
    return () => clearTimeout(dismissTimer);
  }, [duration]);

  // Actually unmount (via parent callback) once the exit animation finishes
  useEffect(() => {
    if (!leaving) return;
    const removeTimer = setTimeout(() => onDismiss?.(), 300);
    return () => clearTimeout(removeTimer);
  }, [leaving, onDismiss]);

  const styles = typeStyles[type];

  return (
    <div
      className={`w-80 overflow-hidden rounded-xl shadow-lg ${styles.bg} ${
        leaving ? "animate-toast-out" : "animate-toast-in"
      }`}
      role="alert"
      aria-live="assertive"
    >
      <p className={`px-4 py-3 text-sm font-medium ${styles.text}`}>{message}</p>
      <div className="h-1 w-full bg-black/10">
        <div
          className={`h-full ${styles.bar}`}
          style={{ animation: `toast-progress ${duration}ms linear forwards` }}
        />
      </div>
    </div>
  );
}