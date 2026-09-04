// ============================================
// server.js - Entry Point
// ============================================
// This is where the app starts. It:
//   1. Loads environment variables
//   2. Connects to MongoDB
//   3. Starts the Express server
// ============================================

// Load environment variables FIRST
import "dotenv/config";

// Import configured Express app and DB connection
import app from "./src/app.js";
import connectDB from "./src/config/db.config.js";
import { startEmailReminderScheduler } from "./src/services/email/reminder.scheduler.js";

// Initiate MongoDB connection for serverless/traditional runtime
connectDB()
  .then(() => {
    // Start automated email reminder scheduler
    startEmailReminderScheduler();
  })
  .catch((err) => console.error("MongoDB connection error:", err.message));

const PORT = process.env.PORT || 5005;

// Only start HTTP listener if not running in Vercel Serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.error(`\n Server is running on port ${PORT}`);
    console.error(` Environment: ${process.env.NODE_ENV || "development"}`);
    console.error(` URL: http://localhost:${PORT}\n`);
  });
}

export default app;
