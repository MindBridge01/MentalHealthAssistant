const { query } = require("../config/database");
const { normalizeId } = require("../models/_shared");

const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = new Set([
  "address",
  "birthday",
  "content",
  "diagnosis",
  "email",
  "guardianemail",
  "guardianname",
  "guardianphone",
  "illnesses",
  "medicalhistory",
  "message",
  "messages",
  "name",
  "notes",
  "patient",
  "patientemail",
  "phone",
  "symptoms",
]);

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function sanitizeMetadataValue(value, key = "", depth = 0) {
  if (depth > 4) return "[TRUNCATED]";
  if (value === null || value === undefined) return null;

  const normalizedKey = String(key).toLowerCase();
  if (normalizedKey && SENSITIVE_KEYS.has(normalizedKey)) {
    return REDACTED;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry) => sanitizeMetadataValue(entry, key, depth + 1));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeMetadataValue(entryValue, entryKey, depth + 1),
      ])
    );
  }

  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value.length > 250 ? `${value.slice(0, 247)}...` : value;
  if (["number", "boolean"].includes(typeof value)) return value;

  return String(value);
}

function sanitizeMetadata(metadata = {}) {
  if (!isPlainObject(metadata)) {
    return { value: sanitizeMetadataValue(metadata) };
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, sanitizeMetadataValue(value, key)])
  );
}

async function logAuditEvent({
  userId = null,
  role = null,
  action,
  resourceType,
  resourceId = null,
  ipAddress = null,
  timestamp = new Date(),
  metadata = {},
}) {
  if (!action || !resourceType) {
    throw new Error("action and resourceType are required to log an audit event");
  }

  const result = await query(
    `INSERT INTO audit_logs (
      user_id, user_role, action, resource_type, resource_id, ip_address, "timestamp", metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
    RETURNING id, user_id, user_role, action, resource_type, resource_id, ip_address, "timestamp", metadata`,
    [
      normalizeId(userId),
      role || null,
      action,
      resourceType,
      resourceId ? normalizeId(resourceId) : null,
      ipAddress,
      timestamp,
      JSON.stringify(sanitizeMetadata(metadata)),
    ]
  );

  return result.rows[0];
}

async function logAuditEventSafely(event) {
  try {
    return await logAuditEvent(event);
  } catch (error) {
    console.error("[audit] failed to persist event", {
      action: event?.action,
      resourceType: event?.resourceType,
      resourceId: event?.resourceId || null,
      message: error.message,
    });
    return null;
  }
}

async function listAuditLogs(filters = {}) {
  const clauses = [];
  const values = [];

  if (filters.userId) {
    values.push(normalizeId(filters.userId));
    clauses.push(`user_id = $${values.length}`);
  }
  if (filters.action) {
    values.push(filters.action);
    clauses.push(`action = $${values.length}`);
  }
  if (filters.resourceType) {
    values.push(filters.resourceType);
    clauses.push(`resource_type = $${values.length}`);
  }
  if (filters.resourceId) {
    values.push(normalizeId(filters.resourceId));
    clauses.push(`resource_id = $${values.length}`);
  }
  if (filters.from) {
    values.push(new Date(filters.from));
    clauses.push(`"timestamp" >= $${values.length}`);
  }
  if (filters.to) {
    values.push(new Date(filters.to));
    clauses.push(`"timestamp" <= $${values.length}`);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 500);
  values.push(limit);

  const result = await query(
    `SELECT id, user_id, user_role, action, resource_type, resource_id, ip_address, "timestamp", metadata
     FROM audit_logs
     ${whereClause}
     ORDER BY "timestamp" DESC
     LIMIT $${values.length}`,
    values
  );

  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userRole: row.user_role,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    ipAddress: row.ip_address,
    timestamp: row.timestamp,
    metadata: row.metadata || {},
  }));
}

module.exports = {
  logAuditEvent,
  logAuditEventSafely,
  listAuditLogs,
  sanitizeMetadata,
};
