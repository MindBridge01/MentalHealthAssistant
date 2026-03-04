function logSafetyEvent({ eventType, userRole, metadata = {} }) {
  const safeMetadata = {
    ...(metadata.severity ? { severity: metadata.severity } : {}),
    ...(metadata.reason ? { reason: metadata.reason } : {}),
  };

  console.warn("[safety-event]", {
    timestamp: new Date().toISOString(),
    eventType,
    userRole: userRole || "unknown",
    ...safeMetadata,
  });
}

module.exports = { logSafetyEvent };
