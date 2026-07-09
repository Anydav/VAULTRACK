import PortfolioSummary from "./portfolioSummary";
import AllocationChart from "./AllocationChart";
import HoldingTable from "./holdingTable";

export default function Portfolio() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#17352F]">Portfolio</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PortfolioSummary />
        <AllocationChart />
      </div>
      <HoldingTable />
    </div>
  );
}