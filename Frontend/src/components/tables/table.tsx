import type { ReactNode } from "react";
import { ErrorState } from "../ui/errorState";
import { Skeleton } from "../ui/skeleton";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyAction?: ReactNode;
}

export function Table<T>({
  columns,
  data,
  getRowKey,
  isLoading,
  isError,
  onRetry,
  emptyMessage = "No data available",
  emptyAction,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-4 py-2" aria-busy="true" aria-label="Loading">
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="flex gap-4">
            {columns.map((column) => (
              <Skeleton key={column.key} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center">
        <ErrorState onRetry={onRetry} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
        <p className="text-base font-semibold text-gray-500">
          {emptyMessage}
        </p>
        {emptyAction && <div className="mt-2">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm tabular-nums">
        <thead>
          <tr className="text-gray-400">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`whitespace-nowrap border-r border-border px-3 pb-3 font-medium first:pl-0 last:border-r-0 last:pr-0 ${
                  column.align === "right"
                    ? "text-right"
                    : column.align === "center"
                    ? "text-center"
                    : "text-left"
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-t border-border hover:bg-background/60"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`whitespace-nowrap border-r border-border px-3 py-3 first:pl-0 last:border-r-0 last:pr-0 ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}