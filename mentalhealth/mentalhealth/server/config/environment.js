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
      if (!origin || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
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
  
  return origins;
}

module.exports = {
  loadEnvironment,
  isProduction,
  getCorsOrigins,
};
