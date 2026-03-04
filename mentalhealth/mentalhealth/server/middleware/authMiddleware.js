// middleware/authMiddleware.js
const { verifyToken } = require('../lib/jwt');

function authenticateJWT(requiredRole = null) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.auth_token;
    const tokenFromHeader =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;
    const token = tokenFromHeader || cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

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

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Access denied. Role not authorized.' });
    }
    return next();
  };
}

module.exports = { authenticateJWT, authorizeRoles };
