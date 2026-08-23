import { onRequest } from "firebase-functions/v2/https";
import app from "./src/app.js";
import connectDB from "./src/config/db.config.js";

// Initiate MongoDB connection
connectDB().catch((err) => console.error("Firebase DB connection error:", err.message));

// Export Firebase Cloud Function 'api'
export const api = onRequest({ cors: true, memory: "1GiB" }, app);
