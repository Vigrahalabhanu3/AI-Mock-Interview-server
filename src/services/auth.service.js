// ============================================
// auth.service.js - Authentication Service
// ============================================
// Contains the business logic for:
//   - Email/password registration and login
//   - Auto-creation on sign-in with clean name derivation
//   - Getting and updating user profile
// Reference: bcrypt.hash(), bcrypt.compare() - reference-backend.md
// ============================================

import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import { generateToken } from '../utils/jwt.utils.js';
import { deriveNameFromEmail } from '../utils/user.utils.js';

/**
 * Register a new user with email and password.
 */
export const register = async (name, email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already exists
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const error = new Error('Email already registered.');
    error.statusCode = 409;
    throw error;
  }

  const finalName = (name && name.trim()) || deriveNameFromEmail(normalizedEmail);

  // Hash the password with bcrypt (10 salt rounds)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the user in the database
  const user = await User.create({
    name: finalName,
    email: normalizedEmail,
    password: hashedPassword,
  });

  // Generate a JWT token
  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      targetRole: user.targetRole,
      experienceLevel: user.experienceLevel,
    },
  };
};

/**
 * Login a user with email and password.
 * If the user enters a new email, automatically provisions an account
 * with their clean username derived from their email address.
 * Corrects any legacy "bhanu" placeholder name if the user has a different email.
 */
export const emailLogin = async (email, password) => {
  if (!email) {
    const error = new Error('Email is required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Gracefully provision the account using candidate's email & clean name
    const derivedName = deriveNameFromEmail(normalizedEmail);
    const hashedPassword = await bcrypt.hash(password || 'Password123!', 10);
    user = await User.create({
      name: derivedName,
      email: normalizedEmail,
      password: hashedPassword,
    });
  } else {
    // Compare password
    if (user.password && password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        const error = new Error('Invalid email or password.');
        error.statusCode = 401;
        throw error;
      }
    }

    // Auto-fix if user's name is legacy 'bhanu' or 'Test User' but email does NOT contain 'bhanu'
    if (
      user.name &&
      user.name.toLowerCase() === 'bhanu' &&
      !normalizedEmail.includes('bhanu') &&
      !normalizedEmail.includes('banu')
    ) {
      user.name = deriveNameFromEmail(normalizedEmail);
      await user.save();
    }
  }

  // Update last login time
  user.lastLogin = new Date();
  await user.save();

  // Generate a JWT token
  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      targetRole: user.targetRole,
      experienceLevel: user.experienceLevel,
    },
  };
};

/**
 * Get a user's profile by their ID.
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-__v -password');

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    targetRole: user.targetRole || 'Full Stack Developer',
    experienceLevel: user.experienceLevel || 'Mid-Senior Level (3-5 yrs)',
    picture: user.picture,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
};

/**
 * Update a user's profile preferences.
 */
export const updateUserProfile = async (userId, { name, targetRole, experienceLevel }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (name && name.trim()) {
    user.name = name.trim();
  }
  if (targetRole) {
    user.targetRole = targetRole;
  }
  if (experienceLevel) {
    user.experienceLevel = experienceLevel;
  }

  await user.save();

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    targetRole: user.targetRole,
    experienceLevel: user.experienceLevel,
    picture: user.picture,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
};
