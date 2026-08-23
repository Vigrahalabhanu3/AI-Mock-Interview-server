import app from '../src/app.js';
import connectDB from '../src/config/db.config.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in Vercel handler:', err);
  }
  return app(req, res);
}
