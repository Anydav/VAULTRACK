import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex min-h-[120px] w-full flex-col items-center justify-center gap-2 text-center">
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      {description && (
        <p className="max-w-xs text-xs text-gray-400">{description}</p>
      )}
    </div>
  );
}