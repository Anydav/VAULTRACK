import axios from "axios";
import type { QueryClient } from "@tanstack/react-query";

// The server's own message for errors the user can fix (400, 404), e.g.
// "Cannot sell 0.3 when only 0 is held at that date". Other errors can
// carry internal details, so they get a generic message.
export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if ((status === 400 || status === 404) && typeof message === "string") {
      return message;
    }
  }

  return "Something went wrong. Please try again.";
}

// After adding, selling or removing, reload everything that shows holdings,
// accounts or transactions so every page matches without a refresh.
export function refreshPortfolio(queryClient: QueryClient) {
  for (const key of ["user-assets", "dashboard-summary", "accounts", "transactions", "portfolio-snapshots"]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

// Today's date in the user's own timezone, as YYYY-MM-DD for date inputs
export function todayLocal() {
  return new Date().toLocaleDateString("en-CA");
}
