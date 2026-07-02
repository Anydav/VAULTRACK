import cron from "node-cron";
import { supabase } from "../config/supabase.js";
import { createPortfolioSnapshot } from "../services/snapshot.service.js";

export function startSnapshotJob() {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily portfolio snapshot job...");

    const { data: users, error } = await supabase
      .from("profiles")
      .select("id");

    if (error) {
      console.error("Failed to fetch users for snapshot job:", error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log("No users found for snapshot job.");
      return;
    }

    for (const user of users) {
      try {
        await createPortfolioSnapshot(user.id);
        console.log(`Snapshot created for user: ${user.id}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";

        console.error(`Snapshot failed for user ${user.id}:`, message);
      }
    }

    console.log("Daily portfolio snapshot job completed.");
  });
}