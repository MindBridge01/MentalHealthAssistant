const { logAuditEventSafely } = require("../services/auditLogService");

function getIpAddress(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
}

function auditLogger(req, _res, next) {
  const context = {
    userId: req.user?._id || null,
    role: req.user?.role || null,
    route: req.originalUrl || req.path || "",
    method: req.method,
    timestamp: new Date(),
    ipAddress: getIpAddress(req),
  };

  req.auditContext = context;
  req.logAuditEvent = (event = {}) =>
    logAuditEventSafely({
      userId: event.userId ?? req.user?._id ?? context.userId,
      role: event.role ?? req.user?.role ?? context.role,
      ipAddress: event.ipAddress ?? context.ipAddress,
      timestamp: event.timestamp ?? context.timestamp,
      metadata: {
        route: context.route,
        method: context.method,
        ...event.metadata,
      },
      ...event,
    });

  return next();
}

module.exports = { auditLogger, getIpAddress };
