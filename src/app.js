// ============================================
// app.js - Express Application Setup
// ============================================
// This file configures the Express app with:
//   - CORS (so React frontend can talk to us)
//   - Body parsing (JSON + large payloads)
//   - API routes
//   - Error handling
// ============================================

import express from 'express';
import cors from 'cors';

// Import all routes (bundled in one index file)
import routes from './routes/index.js';

// Import the global error handler
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// ---- Create the Express App ----
const app = express();

// ============================================
// MIDDLEWARE (runs on every request, in order)
// ============================================

// 1. CORS: Allow our frontend (React) to talk to this backend
//    We allow the CLIENT_URL env var, or common local dev ports
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5175',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 2. Body Parser: Convert incoming JSON requests to JavaScript objects
//    10mb limit to handle large resume text and interview data
app.use(express.json({ limit: '10mb' }));

// ============================================
// ROUTES
// ============================================

// Mount all API routes under /api
// /api/auth      → authentication routes
// /api/interview → interview routes (start, answer, feedback)
// /api/resume    → resume upload and parsing routes
// /api/history   → interview history routes
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Server is running' }));
app.use('/api', routes);

// ============================================
// ERROR HANDLING (must be AFTER routes)
// ============================================

// Handle 404 - Route not found
app.use(notFoundHandler);

// Handle all other errors (500, validation errors, etc.)
app.use(errorHandler);

// Export the app (used in server.js)
export default app;
