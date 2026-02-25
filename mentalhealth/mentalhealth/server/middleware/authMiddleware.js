// middleware/authMiddleware.js
const { verifyToken } = require('../lib/jwt');

function authenticateJWT(requiredRole = null) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyToken(token);
      req.user = decoded; // attach decoded user info to request

      // If requiredRole is specified, check role
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: 'Access denied. Role not authorized.' });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

module.exports = { authenticateJWT };