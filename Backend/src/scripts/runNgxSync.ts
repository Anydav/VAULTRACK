import { syncStockPrices } from "../services/price.service.js";
import { isNgxOpen } from "../services/mansaMarket.service.js";

async function run() {
  const label = process.argv[2] ?? "scheduled run";
  console.log(`Running NGX price sync (${label})...`);

  try {
    const isOpen = await isNgxOpen();

    if (!isOpen) {
      console.log(`NGX is closed — skipping sync (${label}).`);
      process.exit(0);
    }

    const updated = await syncStockPrices();
    console.log(
      `NGX price sync completed (${label}): ${updated.length} prices updated`
    );
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`NGX price sync failed (${label}):`, message);
    process.exit(1);
  }
}

run();
