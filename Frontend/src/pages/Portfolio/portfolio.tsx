import PortfolioSummary from "./portfolioSummary";
import AllocationChart from "./allocationChart";
import HoldingTable from "./holdingTable";
import { PageHeader } from "../../components/ui/pageHeader";

export default function Portfolio() {
  return (
    <div className="space-y-6">
      <PageHeader title="Portfolio" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PortfolioSummary />
        <AllocationChart />
      </div>
      <HoldingTable />
    </div>
  );
}