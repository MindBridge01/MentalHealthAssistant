const path = require("path");

let loaded = false;

function loadEnvironment() {
  if (loaded) return;
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  loaded = true;
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getCorsOrigins() {
  // In development, accept all localhost ports (for Flutter web dynamic ports)
  if (!isProduction()) {
    return (origin, callback) => {
      let local = !origin;
      try {
        const url = new URL(origin);
        local = url.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
      } catch { /* Invalid origins are denied. */ }
      if (local) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    };
  }
  
  // In production, only allow configured origins
  const origins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!origins.length) throw new Error('CLIENT_ORIGIN is required in production.');
  
  return origins;
}

module.exports = {
  loadEnvironment,
  isProduction,
  getCorsOrigins,
};
