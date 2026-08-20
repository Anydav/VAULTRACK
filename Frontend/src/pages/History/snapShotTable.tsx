import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPortfolioSnapshots } from "../../services/snapShot.service";
import { Table, type TableColumn } from "../../components/tables/table";
import type { PortfolioSnapshot } from "../../types/snapShot";
import { formatCurrency } from "../../utils";

interface SnapshotRow extends PortfolioSnapshot {
  dailyChangeDisplay: number;
  dailyChangePercentage: number;
}

export default function SnapshotTable() {
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["portfolio-snapshots"],
    queryFn: getPortfolioSnapshots,
  });

  const rows: SnapshotRow[] = useMemo(() => {
    const sorted = [...snapshots].sort(
      (a, b) =>
        new Date(a.snapshot_date).getTime() -
        new Date(b.snapshot_date).getTime()
    );

    const withChange = sorted.map((snapshot, index) => {
      const previous = sorted[index - 1];

      const dailyChangeDisplay = previous
        ? snapshot.total_portfolio_value_display -
          previous.total_portfolio_value_display
        : 0;

      const dailyChangePercentage =
        previous && previous.total_portfolio_value_display > 0
          ? (dailyChangeDisplay / previous.total_portfolio_value_display) * 100
          : 0;

      return { ...snapshot, dailyChangeDisplay, dailyChangePercentage };
    });

    // Most recent first for display
    return withChange.reverse();
  }, [snapshots]);

  const columns: TableColumn<SnapshotRow>[] = [
    {
      key: "date",
      header: "Date",
      render: (row) =>
        new Date(row.snapshot_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "value",
      header: "Portfolio Value",
      align: "right",
      render: (row) =>
        formatCurrency(row.total_portfolio_value_display, row.display_currency),
    },
    {
      key: "change",
      header: "Daily Change",
      align: "right",
      render: (row) => {
        const isProfit = row.dailyChangePercentage >= 0;
        return (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isProfit
                ? "bg-success-bg text-success"
                : "bg-danger-bg text-danger"
            }`}
          >
            {isProfit ? "+" : ""}
            {row.dailyChangePercentage.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-lg font-semibold text-text">
        Snapshot Table
      </h2>

      <Table
        columns={columns}
        data={rows}
        getRowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No snapshots recorded yet"
      />
    </div>
  );
}