import SummaryCard from "./sumaryCard";
import AssetHoldingCard from "./AssetHoldingCard";
import AnalyisChart from "./AnalysisChart";
import CurrencyOnboardingModal from "./CurrencyOnboardingModal";
import { useAddAssetModal } from "../../context/addAssetModelcontext";
import { PageHeader } from "../../components/ui/pageHeader";
import { Button } from "../../components/ui/button";

export default function Dashboard() {
  const { openAddAssetModal } = useAddAssetModal();

  return  (
    <div className="space-y-6">
      <CurrencyOnboardingModal />
      <PageHeader
        title="Dashboard"
        actions={<Button onClick={() => openAddAssetModal()}>+ Add Asset</Button>}
      />
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
