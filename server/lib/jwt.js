// server/lib/jwt.js
const jwt = require('jsonwebtoken');


const SECRET = process.env.JWT_SECRET;
const MIN_SECRET_LENGTH = 32;

if (!SECRET) {
  throw new Error('JWT_SECRET is required');
}

if (SECRET.length < MIN_SECRET_LENGTH) {
  throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
}

function generateToken(user) {
  // user = { _id, email, role }
  return jwt.sign(
    { _id: user._id, email: user.email, role: user.role, sid:user.sid, mfa:user.mfa === true, authVersion:user.authVersion || 0, purpose:"session" },
    SECRET,
    { expiresIn: '1h' } // token valid for 1 hour
  );
}

function verifyToken(token) {
  return jwt.verify(token, SECRET, { algorithms: ["HS256"] });
}

module.exports = { generateToken, verifyToken };
