const { evaluatePromptGuardrails } = require("../services/promptGuardrailService");
const { getBlockedDiagnosisResponse } = require("../services/safeResponseService");
const { logSafetyEvent } = require("../services/safetyEventLogger");

function promptGuardrailMiddleware(req, res, next) {
  const candidateMessage = req.piiSafeMessage || req.body?.message || "";
  const evaluation = evaluatePromptGuardrails(candidateMessage);

  if (!evaluation.blocked) {
    return next();
  }

  logSafetyEvent({
    eventType: "blocked_prompt",
    userRole: req.user?.role,
    metadata: { severity: "medium", reason: evaluation.reason },
  });

  return res.status(200).json({
    content: getBlockedDiagnosisResponse(),
    safety: { event: "blocked_prompt", reason: evaluation.reason },
  });
}

module.exports = { promptGuardrailMiddleware };
