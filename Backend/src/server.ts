import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./config/supabase.js";
import authRoutes from "./routes/auth.routes.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import accountRoutes from "./routes/account.routes.js";
import assetRoutes from "./routes/asset.routes.js";
import userAssetRoutes from "./routes/userAsset.routes.js";
import priceRoutes from "./routes/price.routes.js";
import dashboardRoutes from "./routes/dashbaord.routes.js";
import snapshotRoutes from "./routes/snapshot.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import { startSnapshotJob } from "./jobs/snapshot.job.js";
import { startNgxSyncJob } from "./jobs/ngxSync.job.js";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://vaultrack.vercel.app"],
    credentials: true,
  })
);
startSnapshotJob();
startNgxSyncJob();
app.use(express.json());

app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "VaultTrack API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.get("/api/test-db", async (req: Request, res: Response) => {
  const { data, error } = await supabase.from("profiles").select("*").limit(1);

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Database connected successfully",
    data,
  });
});

app.get("/api/protected-test", authMiddleware, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "You accessed a protected route",
    user: req.user,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/user-assets", userAssetRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/snapshots", snapshotRoutes);
app.use("/api/analysis", analysisRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

