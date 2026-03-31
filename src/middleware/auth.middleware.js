// ============================================
// auth.middleware.js - Authentication Middleware
// ============================================
// Protects routes that require login.
// Checks if the request has a valid JWT token.
//
// How it works:
// 1. Frontend sends: Authorization: Bearer <token>
// 2. This middleware extracts and verifies the token
// 3. If valid → attaches user to req.user, moves on
// 4. If invalid → sends error, stops the request
// Reference: Middleware, req.headers - reference-backend.md
// ============================================

import { verifyToken } from '../utils/jwt.utils.js';
import User from '../models/User.model.js';

const authenticate = async (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to access this route.',
      });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // Verify the token and decode it
    const decoded = verifyToken(token);

    // Find the user in the database (exclude password for security)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.',
      });
    }

    // Attach user to request — now all route handlers can use req.user
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

export default authenticate;
