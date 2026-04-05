const WINDOW_STATE = new Map();

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function resolveIdentity(req, scope = "ip") {
  if (scope === "user-or-ip" && req.user?._id) {
    return `user:${req.user._id}`;
  }

  return `ip:${getClientIp(req)}`;
}

function createRateLimiter({
  windowMs,
  maxRequests,
  scope = "ip",
  message = "Too many requests. Please try again later.",
}) {
  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const key = `${scope}:${resolveIdentity(req, scope)}:${req.path}`;
    const existing = WINDOW_STATE.get(key);

    if (!existing || existing.resetAt <= now) {
      WINDOW_STATE.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    existing.count += 1;

    if (existing.count <= maxRequests) {
      return next();
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));

    return res.status(429).json({
      error: message,
    });
  };
}

const publicChatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 12,
  scope: "ip",
  message: "Too many chat requests from this IP. Please slow down and try again shortly.",
});

const authenticatedChatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  scope: "user-or-ip",
  message: "Too many chat requests on this account. Please wait a moment before sending more.",
});

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  scope: "ip",
  message: "Too many authentication attempts. Please try again later.",
});

module.exports = {
  authRateLimiter,
  publicChatRateLimiter,
  authenticatedChatRateLimiter,
};
