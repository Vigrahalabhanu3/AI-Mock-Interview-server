// ============================================
// jwt.utils.js - JWT Token Utilities
// ============================================
// JSON Web Tokens (JWT) are how we keep users
// logged in after they authenticate.
//
// How it works:
// 1. User logs in → we create a JWT
// 2. Frontend stores the JWT in localStorage
// 3. Frontend sends JWT with every API request
// 4. Backend verifies the JWT on each request
// Reference: jwt.sign(), jwt.verify() - reference-backend.md
// ============================================

import jwt from 'jsonwebtoken';

/**
 * Create a new JWT token for a user.
 *
 * @param {object} user - The user object from MongoDB
 * @returns {string} - The signed JWT token
 */
export const generateToken = (user) => {
  // The "payload" is the data we encode inside the token
  const payload = {
    id: user._id, // User's MongoDB ID
    email: user.email, // User's email
  };

  // Sign (create) the token with our secret key
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // Token expires in 7 days
  });
};

/**
 * Verify a JWT token and extract the payload.
 *
 * @param {string} token - The JWT token to verify
 * @returns {object} - The decoded payload { id, email, iat, exp }
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
