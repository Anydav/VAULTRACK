import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

// Title on the left, actions on the right; wraps under each other on narrow screens
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
