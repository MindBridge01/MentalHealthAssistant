// middleware/authMiddleware.js
const { verifyToken } = require('../lib/jwt');
const { normalizeRole } = require('./permissionMiddleware');

function logAuthorizationFailure(req, reason) {
  console.warn("[authz-deny]", {
    timestamp: new Date().toISOString(),
    userId: req.user?._id ? String(req.user._id) : "anonymous",
    route: req.originalUrl || req.path || "unknown",
    reason,
  });
}

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
      req.user = { ...decoded, role: normalizeRole(decoded.role) }; // attach normalized role from verified token

      // If requiredRole is specified, check role
      if (requiredRole && req.user.role !== normalizeRole(requiredRole)) {
        logAuthorizationFailure(req, `role_required:${requiredRole}`);
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
    const role = normalizeRole(req.user?.role);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
    if (!role || !normalizedAllowedRoles.includes(role)) {
      logAuthorizationFailure(req, `role_not_allowed:${role || "unknown"}`);
      return res.status(403).json({ error: 'Access denied. Role not authorized.' });
    }
    return next();
  };
}

module.exports = { authenticateJWT, authorizeRoles };
