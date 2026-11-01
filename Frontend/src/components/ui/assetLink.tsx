import { Link } from "react-router-dom";
import type { Holding } from "../../types/userAssets";

// Asset symbol linking to its asset page
export function AssetLink({ holding }: { holding: Holding }) {
  if (!holding.assets) return <span className="font-medium text-text">-</span>;

  return (
    <Link to={`/assets/${holding.assets.id}`} className="font-medium text-text hover:underline">
      {holding.assets.symbol}
    </Link>
  );
}
