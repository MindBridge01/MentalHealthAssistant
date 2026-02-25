// models/User.js
const { ObjectId } = require('mongodb');

// This is a sample schema for MongoDB (no Mongoose, just for reference)
// If you use Mongoose, you can convert this to a Mongoose schema easily.

/**
 * User document example:
 * {
 *   _id: ObjectId,
 *   email: String,
 *   name: String,
 *   googleId: String, // if using Google login
 *   profilePic: String,
 *   role: String, // 'user' or 'doctor'
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

// You can use this as a reference for validation or for Mongoose schema.

module.exports = {};
