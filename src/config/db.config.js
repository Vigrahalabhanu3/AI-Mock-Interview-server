// ============================================
// db.config.js - MongoDB Connection
// ============================================
// Connects to MongoDB Atlas using Mongoose.
// Reference: mongoose.connect() - reference-mongodb.md
// ============================================

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-mock-interview';
    let conn;
    try {
      conn = await mongoose.connect(mongoURI);
    } catch (err) {
      const localURI = 'mongodb://127.0.0.1:27017/ai-mock-interview';
      if (mongoURI !== localURI) {
        console.error(`Primary MongoDB Connection failed (${err.message}). Connecting to local MongoDB...`);
        conn = await mongoose.connect(localURI);
      } else {
        throw err;
      }
    }
    console.error(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
