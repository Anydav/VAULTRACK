import { seedNgxAssets } from "../services/ngxSeed.service.js";

async function run() {
  console.log("Seeding NGX assets...");

  try {
    const result = await seedNgxAssets();
    console.log("Done:", result);
    process.exit(0);
  } catch (err) {
    console.error("NGX seed failed:", err);
    process.exit(1);
  }
}

run();