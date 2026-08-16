type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <p className="text-sm font-medium text-danger">{title}</p>
      <p className="max-w-xs text-xs text-gray-400">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-danger-bg px-3 py-1.5 text-xs font-semibold text-danger transition hover:opacity-80"
        >
          Try again
        </button>
      )}
    </div>
  );
}