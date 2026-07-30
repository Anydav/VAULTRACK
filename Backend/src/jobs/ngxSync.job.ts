import cron from "node-cron";
import { syncStockPrices } from "../services/price.service.js";
import { isNgxOpen } from "../services/mansaMarket.service.js";

async function runNgxSync(label: string) {
  console.log(`Running NGX price sync (${label})...`);

  try {
    const isOpen = await isNgxOpen();

    if (!isOpen) {
      console.log(`NGX is closed — skipping sync (${label}).`);
      return;
    }

    const updated = await syncStockPrices();
    console.log(`NGX price sync completed (${label}): ${updated.length} prices updated`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`NGX price sync failed (${label}):`, message);
  }
}

export function startNgxSyncJob() {
  const cronOptions = { timezone: "Africa/Lagos" };

  cron.schedule("15 9 * * 1-5", () => runNgxSync("market open"), cronOptions);
  cron.schedule("30 12 * * 1-5", () => runNgxSync("midday"), cronOptions);
  cron.schedule("15 14 * * 1-5", () => runNgxSync("pre-close"), cronOptions);
}