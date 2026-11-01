// A grey placeholder bar that pulses while content loads
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

// Placeholder for a summary card: label, big number, small line, then two stats
export function CardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mt-5 flex gap-6 border-t border-border pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}
