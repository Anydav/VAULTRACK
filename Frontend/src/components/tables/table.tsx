import { Fragment, type ReactNode } from "react";
import { ErrorState } from "../ui/errorState";
import { Skeleton } from "../ui/skeleton";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  // Phones: "title" = top-left (default: first column), "value" = top-right,
  // "hidden" = left out. Other columns show as label + value underneath;
  // columns with no header (buttons) go at the bottom.
  mobile?: "title" | "value" | "hidden";
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
      <div aria-busy="true" aria-label="Loading">
        {/* Phones: card-shaped placeholders */}
        <div className="space-y-4 md:hidden">
          {Array.from({ length: 3 }).map((_, row) => (
            <div key={row} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>

        {/* Tablet and up: one bar per column */}
        <div className="hidden space-y-4 py-2 md:block">
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={row} className="flex gap-4">
              {columns.map((column) => (
                <Skeleton key={column.key} className="h-5 flex-1" />
              ))}
            </div>
          ))}
        </div>
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

  const titleColumn = columns.find((column) => column.mobile === "title") ?? columns[0];
  const valueColumn = columns.find((column) => column.mobile === "value");
  const rest = columns.filter(
    (column) => column !== titleColumn && column !== valueColumn && column.mobile !== "hidden"
  );
  const detailColumns = rest.filter((column) => column.header);
  const actionColumns = rest.filter((column) => !column.header);

  return (
    <>
      {/* Phones: each row as a stacked card */}
      <ul className="divide-y divide-border md:hidden">
        {data.map((row) => {
          const actions = actionColumns
            .map((column) => ({ key: column.key, node: column.render(row) }))
            .filter((action) => action.node != null && action.node !== false);

          return (
            <li key={getRowKey(row)} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 font-medium text-text">{titleColumn.render(row)}</div>
                {valueColumn && (
                  <div className="shrink-0 text-right font-semibold tabular-nums text-text">
                    {valueColumn.render(row)}
                  </div>
                )}
              </div>

              {detailColumns.length > 0 && (
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm tabular-nums">
                  {detailColumns.map((column) => (
                    <div key={column.key} className="flex min-w-0 items-baseline justify-between gap-2">
                      <dt className="shrink-0 text-xs text-gray-400">{column.header}</dt>
                      <dd className="min-w-0 truncate text-right text-text">{column.render(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {actions.length > 0 && (
                <div className="mt-3 flex justify-end gap-2">
                  {actions.map((action) => (
                    <Fragment key={action.key}>{action.node}</Fragment>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Tablet and up: the normal table */}
      <div className="hidden overflow-x-auto md:block">
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
    </>
  );
}
