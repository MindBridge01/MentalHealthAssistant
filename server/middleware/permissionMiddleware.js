const { permissions } = require("../config/permissions");

function normalizeRole(role) {
  if (role === "user") return "patient";
  return role;
}

function logAuthorizationFailure(req, reason) {
  console.warn("[authz-deny]", {
    timestamp: new Date().toISOString(),
    userId: req.user?._id ? String(req.user._id) : "anonymous",
    route: req.originalUrl || req.path || "unknown",
    reason,
  });
}

function requirePermission(permission) {
  return (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    const rolePermissions = permissions[role] || [];

    if (!role || !rolePermissions.includes(permission)) {
      logAuthorizationFailure(req, `missing_permission:${permission}`);
      return res.status(403).json({ error: "Access denied. Permission not granted." });
    }

    return next();
  };
}

module.exports = { requirePermission, normalizeRole };
