function normalizeId(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.toString === "function") return value.toString();
  }
  return String(value);
}

function normalizeDate(value) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function serializeJson(value) {
  return value === undefined ? null : JSON.stringify(value);
}

module.exports = {
  normalizeId,
  normalizeDate,
  serializeJson,
};
