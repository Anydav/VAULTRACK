import PortfolioSummary from "./portfolioSummary";
import AllocationChart from "./allocationChart";
import HoldingTable from "./holdingTable";

export default function Portfolio() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Portfolio</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PortfolioSummary />
        <AllocationChart />
      </div>
      <HoldingTable />
    </div>
  );
}