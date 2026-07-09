import SummaryCard from "./sumaryCard";
import AssetHoldingCard from "./AssetHoldingCard";
import AnalyisChart from "./AnalysisChart";

export default function Dashboard() {
  return  (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#17352F]">Dashboard</h1>
        <button
          type="button"
          className="rounded-xl bg-[#17352F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f241f]"
        >
          + Add Asset
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SummaryCard />
          </div>
          <div className="lg:col-span-2">
            <AssetHoldingCard />
          </div>
      </div>

      <AnalyisChart/>
        
    </div>
  );
}
