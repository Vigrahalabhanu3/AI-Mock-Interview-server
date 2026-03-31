// ============================================
// db.config.js - MongoDB Connection
// ============================================
// Connects to MongoDB Atlas using Mongoose.
// Reference: mongoose.connect() - reference-mongodb.md
// ============================================

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Get the connection string from environment variables
    const mongoURI = process.env.MONGODB_URI;

    // Safety check: make sure the URI exists
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in your .env file');
    }

    // Connect to MongoDB
    // Mongoose 9.x handles connection options automatically
    const conn = await mongoose.connect(mongoURI);

    console.error(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Stop the server if DB connection fails
  }
};

export default connectDB;
