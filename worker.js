import dotenv from "dotenv";

// Load environment variables BEFORE importing other modules
dotenv.config({ path: ".env.local" });

import { deployWorker } from "./lib/workers/deployWorker.js";

console.log("🚀 Build & Deploy Worker started. Waiting for jobs...");

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing worker...");
  await deployWorker.close();
  process.exit(0);
});