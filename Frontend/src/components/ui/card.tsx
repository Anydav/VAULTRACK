import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

// The standard white panel every section of a page sits in
export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </div>
  );
}
