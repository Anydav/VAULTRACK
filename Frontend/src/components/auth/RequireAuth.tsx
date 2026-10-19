import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getMe } from "../../services/profile.service";
import { LoadingSpinner } from "../ui/loadingSpinner";
import { ErrorState } from "../ui/errorState";

function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

// Wraps every private page: only renders them once the backend confirms
// who the user is. Shares the ["me"] query with Topbar, so no extra request.
export function RequireAuth() {
  const { data: profile, error, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    // A 401 means "logged out" — retrying won't change that, so redirect straight away.
    retry: (failureCount, error) => !isUnauthorized(error) && failureCount < 3,
  });

  if (isUnauthorized(error)) {
    return <Navigate to="/auth" replace />;
  }

  if (profile) {
    return <Outlet />;
  }

  if (error) {
    // Server unreachable or crashed — that doesn't mean the user is logged out.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ErrorState
          title="Couldn't reach the server"
          description="Check your connection and try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner message="Loading your portfolio..." />
    </div>
  );
}
