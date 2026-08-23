import { onRequest } from "firebase-functions/v2/https";
import app from "./src/app.js";
import connectDB from "./src/config/db.config.js";

// Initiate MongoDB connection
connectDB().catch((err) => console.error("Firebase DB connection error:", err.message));

// Export 24/7 Always-On Firebase Cloud Function 'api'
export const api = onRequest(
  {
    cors: true,
    memory: "1GiB",
    minInstances: 1, // ⚡ Keeps 1 instance awake 24/7 with NO SLEEP and 0s cold start!
  },
  app
);
