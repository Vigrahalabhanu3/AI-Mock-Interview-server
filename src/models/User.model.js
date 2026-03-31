// ============================================
// User.model.js - User Database Schema
// ============================================
// Defines what a "User" looks like in our database.
// Users sign in via email/password.
// Reference: mongoose.Schema, mongoose.model - reference-mongodb.md
// ============================================

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // User's email address
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // User's display name
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // Hashed password
    password: {
      type: String,
      required: [true, 'Password is required'],
    },

    // URL to the user's profile picture
    picture: {
      type: String,
      default: '',
    },

    // When the user last logged in
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Create the model from the schema
// "User" → Mongoose will create a "users" collection in MongoDB
const User = mongoose.model('User', userSchema);

export default User;
