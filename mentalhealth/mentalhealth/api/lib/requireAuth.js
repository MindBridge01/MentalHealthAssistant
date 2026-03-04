import jwt from "jsonwebtoken";

const MIN_SECRET_LENGTH = 32;

function parseCookieToken(cookieHeader) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  const authCookie = cookies.find((entry) => entry.startsWith("auth_token="));
  if (!authCookie) return null;
  return decodeURIComponent(authCookie.split("=")[1] || "");
}

export function requireAuth(req) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }

  const authHeader = req.headers?.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
  const cookieToken = parseCookieToken(req.headers?.cookie);
  const token = bearerToken || cookieToken;

  if (!token) return null;

  try {
    return jwt.verify(token, secret);
  } catch (_err) {
    return null;
  }
}
