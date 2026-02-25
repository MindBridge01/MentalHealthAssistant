// server/lib/jwt.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'supersecretkey'; // store in .env

function generateToken(user) {
  // user = { _id, email, role }
  return jwt.sign(
    { _id: user._id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: '1h' } // token valid for 1 hour
  );
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { generateToken, verifyToken };