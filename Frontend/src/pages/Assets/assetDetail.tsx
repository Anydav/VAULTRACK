import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AssetDetail() {
  const { assetId } = useParams<{ assetId: string }>();

  return (
    <div className="space-y-6">
      <Link
        to="/assets"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Assets
      </Link>

      <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
        <p className="text-lg font-semibold text-primary">Coming soon</p>
        <p className="max-w-xs text-sm text-gray-400">
          Detailed asset insights for this holding are on the way.
        </p>
      </div>
    </div>
  );
}