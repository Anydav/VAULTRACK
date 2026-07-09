import api from "./api";
import type { PortfolioSnapshot, SnapshotPerformance } from "../types/snapShot";

export async function getSnapshotPerformance(): Promise<SnapshotPerformance> {
  const response = await api.get("/snapshots/performance");
  return response.data.data;
}
export async function getPortfolioSnapshots(): Promise<PortfolioSnapshot[]> {
  const response = await api.get("/snapshots");
  return response.data.data;
}