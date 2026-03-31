// ============================================
// auth.routes.js - Authentication Routes
// ============================================
// Defines the URLs for authentication:
//   POST /api/auth/register → Register with email/password
//   POST /api/auth/login    → Login with email/password
//   GET  /api/auth/me       → Get current user
//   POST /api/auth/logout   → Logout
// Reference: Router, HTTP methods - reference-backend.md
// ============================================

import { Router } from 'express';
import { registerUser, loginUser, getMe, logout } from '../controllers/auth.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

// Public routes (no auth needed)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (auth required)
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
