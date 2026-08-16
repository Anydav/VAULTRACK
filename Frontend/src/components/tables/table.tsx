import type { ReactNode } from "react";
import { ErrorState } from "../ui/errorState";

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
}

export function Table<T>({
  columns,
  data,
  getRowKey,
  isLoading,
  isError,
  onRetry,
  emptyMessage = "No data available",
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
        <p className="text-sm font-medium text-gray-400">Loading...</p>
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
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-gray-400">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`whitespace-nowrap pb-3 font-medium ${
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
              className="border-t border-gray-50 hover:bg-gray-50/50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`whitespace-nowrap py-3 ${
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