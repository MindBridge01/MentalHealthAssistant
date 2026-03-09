const { getCrisisResponse } = require("../services/safeResponseService");
const { logSafetyEvent } = require("../services/safetyEventLogger");

const CRISIS_PATTERNS = Object.freeze([
  /\b(kill myself|end my life|suicide|want to die|don't want to live|ending my life)\b/i,
  /\b(self[-\s]?harm|hurt myself|cut myself|overdose)\b/i,
  /\b(no reason to live|can't go on|life is pointless|hopeless)\b/i,
  /\b(emergency|help me now|immediate danger|i am in danger)\b/i,
]);

function detectCrisisRisk(message = "") {
  if (typeof message !== "string") return false;
  return CRISIS_PATTERNS.some((pattern) => pattern.test(message));
}

function crisisDetectionMiddleware(req, res, next) {
  const candidateMessage = req.piiSafeMessage || req.body?.message || "";

  if (!detectCrisisRisk(candidateMessage)) {
    return next();
  }

  logSafetyEvent({
    eventType: "crisis_detected",
    userRole: req.user?.role,
    metadata: { severity: "high", reason: "crisis_pattern_match" },
  });

  return res.status(200).json({
    content: getCrisisResponse(),
    safety: { event: "crisis_detected" },
  });
}

module.exports = {
  detectCrisisRisk,
  crisisDetectionMiddleware,
};
