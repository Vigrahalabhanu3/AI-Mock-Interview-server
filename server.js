// ============================================
// server.js - Entry Point
// ============================================
// This is where the app starts. It:
//   1. Loads environment variables
//   2. Connects to MongoDB
//   3. Starts the Express server
// ============================================

// Load environment variables FIRST (before anything else uses them)
import "dotenv/config";

// Import our configured Express app
import app from "./src/app.js";

// Import the database connection function
import connectDB from "./src/config/db.config.js";

// Get the port from .env or use 5000 as default
const PORT = process.env.PORT || 5000;

// ---- Start the Server ----

const startServer = async () => {
  try {
    // Step 1: Connect to MongoDB (wait until connected)
    await connectDB();

    // Step 2: Start listening for HTTP requests
    app.listen(PORT, () => {
      console.error(`\n Server is running on port ${PORT}`);
      console.error(` Environment: ${process.env.NODE_ENV || "development"}`);
      console.error(` URL: http://localhost:${PORT}\n`);
    });
  } catch (error) {
    // If anything fails, log the error and exit
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Call the function to start everything
startServer();
