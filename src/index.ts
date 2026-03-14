// Load env variables first, before any other import
import "dotenv/config";

// Firebase must be initialized before any route/controller imports
import "./infrastructure/firebase/firebase.config";

import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";
import taskRoutes from "./presentation/routes/task.routes";
import authRoutes from "./presentation/routes/auth.routes";
import { env } from "process";

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN ?? "http://localhost:4200" }));
app.use(express.json());

app.use("/tasks", taskRoutes);
app.use("/auth", authRoutes);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

export const api = onRequest(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60,
    invoker: "public",
  },
  app,
);

if (require.main === module) {
  const PORT = 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
