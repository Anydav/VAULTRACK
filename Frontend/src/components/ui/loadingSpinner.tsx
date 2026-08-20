interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { wrapper: "h-8 w-8", dot: "h-1 w-1" },
  md: { wrapper: "h-10 w-10", dot: "h-1.5 w-1.5" },
  lg: { wrapper: "h-14 w-14", dot: "h-2 w-2" },
};

const DOT_COUNT = 8;

export function LoadingSpinner({ message, size = "md" }: LoadingSpinnerProps) {
  const { wrapper, dot } = SIZE_MAP[size];

  return (
    <div className="flex min-h-[120px] w-full flex-col items-center justify-center gap-3">
      <div className={`relative ${wrapper} text-text`}>
        {Array.from({ length: DOT_COUNT }).map((_, index) => {
          const rotation = (360 / DOT_COUNT) * index;
          const delay = (index / DOT_COUNT) * 1;

          return (
            <span
              key={index}
              className={`absolute left-1/2 top-0 ${dot} -translate-x-1/2 animate-pulse rounded-full bg-current`}
              style={{
                transform: `rotate(${rotation}deg) translateY(150%)`,
                transformOrigin: "50% 250%",
                animationDelay: `${delay}s`,
                animationDuration: "1s",
              }}
            />
          );
        })}
      </div>

      {message && (
        <p className="text-sm font-medium text-gray-400">{message}</p>
      )}
    </div>
  );
}