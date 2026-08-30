import { supabase } from "../config/supabase.js";
import { createPortfolioSnapshot } from "../services/snapshot.service.js";

async function run() {
  console.log("Running daily portfolio snapshot job...");

  const { data: users, error } = await supabase.from("profiles").select("id");

  if (error) {
    console.error("Failed to fetch users for snapshot job:", error.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log("No users found for snapshot job.");
    process.exit(0);
  }

  let failures = 0;

  for (const user of users) {
    try {
      await createPortfolioSnapshot(user.id);
      console.log(`Snapshot created for user: ${user.id}`);
    } catch (error) {
      failures++;
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Snapshot failed for user ${user.id}:`, message);
    }
  }

  console.log(`Daily portfolio snapshot job completed. ${failures} failure(s).`);
  process.exit(failures > 0 ? 1 : 0);
}

run();
