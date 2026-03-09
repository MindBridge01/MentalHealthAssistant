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
  return (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = {
  loadEnvironment,
  isProduction,
  getCorsOrigins,
};
